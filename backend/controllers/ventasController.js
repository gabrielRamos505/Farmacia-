const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Obtener todas las ventas
exports.getAllVentas = async (req, res) => {
    try {
        const ventas = await sequelize.query(`
            SELECT TOP 100
                v.ID_Venta,
                v.VEN_Numero_Boleta,
                v.VEN_Fecha_Hora,
                CASE 
                    WHEN p.ID_Persona IS NOT NULL 
                    THEN p.PER_Nombre + ' ' + p.PER_Apellido
                    ELSE 'Cliente General'
                END as cliente,
                v.VEN_Subtotal,
                v.VEN_IGV as igv,
                v.VEN_Total_Venta as total
            FROM Ventas v
            LEFT JOIN Clientes c ON v.ID_Cliente = c.ID_Cliente
            LEFT JOIN Personas p ON c.ID_Persona = p.ID_Persona
            ORDER BY v.VEN_Fecha_Hora DESC
        `, { type: QueryTypes.SELECT });

        res.json(ventas);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({
            message: 'Error al obtener ventas',
            error: error.message
        });
    }
};

// Crear nueva venta
exports.createVenta = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { productos, cliente, tipoPago } = req.body;

        // Validaciones
        if (!productos || productos.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Debe agregar al menos un producto'
            });
        }

        // Validar stock disponible para cada producto
        for (const item of productos) {
            const [stockInfo] = await sequelize.query(`
                SELECT LST_Cantidad_Actual, PCO_Nombre_Comercial
                FROM LotesStock ls
                INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
                WHERE ls.ID_Lote_Stock = :idLote
            `, {
                replacements: { idLote: item.idLote },
                type: QueryTypes.SELECT,
                transaction
            });

            if (!stockInfo) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Producto no encontrado: ${item.idLote}`
                });
            }

            if (stockInfo.LST_Cantidad_Actual < item.cantidad) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Stock insuficiente para: ${stockInfo.PCO_Nombre_Comercial}. Disponible: ${stockInfo.LST_Cantidad_Actual}`
                });
            }
        }

        // Calcular totales
        let subtotal = 0;
        for (const item of productos) {
            subtotal += item.cantidad * item.precioUnitario;
        }

        const igv = subtotal * 0.18;
        const total = subtotal + igv;

        // ✅ GENERAR ID DE VENTA CON UUID
        const ventaId = `VEN-${uuidv4()}`;

        // ✅ GENERAR NÚMERO DE BOLETA SECUENCIAL - ORDENAR POR NÚMERO NO POR FECHA
        const lastBoleta = await sequelize.query(`
            SELECT TOP 1 VEN_Numero_Boleta 
            FROM Ventas 
            WHERE VEN_Numero_Boleta LIKE 'B002-%'
            ORDER BY VEN_Numero_Boleta DESC
        `, { type: QueryTypes.SELECT, transaction });

        let nextBoletaNumber = 1;
        if (lastBoleta.length > 0 && lastBoleta[0].VEN_Numero_Boleta) {
            const parts = lastBoleta[0].VEN_Numero_Boleta.split('-');
            if (parts.length > 1 && !isNaN(parts[1])) {
                nextBoletaNumber = parseInt(parts[1], 10) + 1;
            }
        }

        const boletaNumber = `B002-${String(nextBoletaNumber).padStart(6, '0')}`;

        console.log('🔢 Generando venta:', { ventaId, boletaNumber, nextBoletaNumber });

        // Obtener ID de empleado (por defecto el primer empleado)
        const empleado = await sequelize.query(`
            SELECT TOP 1 ID_Empleado FROM Empleados
        `, { type: QueryTypes.SELECT, transaction });

        if (!empleado || empleado.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'No hay empleados registrados en el sistema'
            });
        }

        // Obtener tipo de comprobante
        const tipoComprobante = await sequelize.query(`
            SELECT TOP 1 ID_Tipo_Comprobante 
            FROM TiposComprobante
            WHERE TCO_Nombre = 'Boleta'
        `, { type: QueryTypes.SELECT, transaction });

        if (!tipoComprobante || tipoComprobante.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'No se encontró el tipo de comprobante Boleta'
            });
        }

        // Obtener tipo de pago
        const tipoPagoQuery = tipoPago ?
            `SELECT ID_Tipo_Pago FROM TiposPago WHERE ID_Tipo_Pago = :tipoPago` :
            `SELECT TOP 1 ID_Tipo_Pago FROM TiposPago WHERE TPA_Nombre = 'Efectivo'`;

        const tipoPagoDb = await sequelize.query(tipoPagoQuery, {
            replacements: tipoPago ? { tipoPago } : {},
            type: QueryTypes.SELECT,
            transaction
        });

        if (!tipoPagoDb || tipoPagoDb.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'No se encontró el tipo de pago especificado'
            });
        }

        // ✅ INSERTAR VENTA CON NOMBRES DE COLUMNAS CORRECTOS
        await sequelize.query(`
            INSERT INTO Ventas (
                ID_Venta, 
                VEN_Numero_Boleta, 
                ID_Tipo_Comprobante,
                VEN_Fecha_Hora, 
                ID_Empleado, 
                ID_Cliente,
                ID_Tipo_Pago,
                VEN_Subtotal, 
                VEN_IGV, 
                VEN_Descuento,
                VEN_Total_Venta
            ) VALUES (
                :ventaId,
                :boletaNumber,
                :tipoComprobante,
                GETDATE(),
                :empleado,
                :cliente,
                :tipoPago,
                :subtotal,
                :igv,
                0,
                :total
            )
        `, {
            replacements: {
                ventaId,
                boletaNumber,
                tipoComprobante: tipoComprobante[0].ID_Tipo_Comprobante,
                empleado: empleado[0].ID_Empleado,
                cliente: cliente || null,
                tipoPago: tipoPagoDb[0].ID_Tipo_Pago,
                subtotal,
                igv,
                total
            },
            transaction
        });

        // ✅ INSERTAR DETALLES CON NOMBRE DE COLUMNA CORRECTO
        for (const item of productos) {
            await sequelize.query(`
                INSERT INTO DetalleVenta (
                    ID_Venta,
                    ID_Lote_Stock,
                    DVE_Cantidad,
                    DVE_Precio_Unitario_Venta,
                    DVE_Subtotal
                ) VALUES (
                    :ventaId,
                    :idLote,
                    :cantidad,
                    :precioUnitario,
                    :subtotal
                )
            `, {
                replacements: {
                    ventaId,
                    idLote: item.idLote,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario,
                    subtotal: item.cantidad * item.precioUnitario
                },
                transaction
            });

            // Actualizar stock
            await sequelize.query(`
                UPDATE LotesStock 
                SET LST_Cantidad_Actual = LST_Cantidad_Actual - :cantidad
                WHERE ID_Lote_Stock = :idLote
            `, {
                replacements: {
                    cantidad: item.cantidad,
                    idLote: item.idLote
                },
                transaction
            });

            // Actualizar estado del lote si el stock llega a 0
            await sequelize.query(`
                UPDATE LotesStock 
                SET LST_Estado = 'Agotado'
                WHERE ID_Lote_Stock = :idLote 
                AND LST_Cantidad_Actual = 0
            `, {
                replacements: { idLote: item.idLote },
                transaction
            });
        }

        // Si hay cliente, actualizar puntos de fidelidad
        if (cliente) {
            const puntosGanados = Math.floor(total / 10); // 1 punto por cada S/ 10
            await sequelize.query(`
                UPDATE Clientes 
                SET CLI_Puntos_Fidelidad = CLI_Puntos_Fidelidad + :puntos
                WHERE ID_Cliente = :cliente
            `, {
                replacements: {
                    puntos: puntosGanados,
                    cliente
                },
                transaction
            });
        }

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Venta creada exitosamente',
            ventaId,
            boletaNumber,
            subtotal,
            igv,
            total
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear venta',
            error: error.message
        });
    }
};

// Buscar productos disponibles
exports.searchProductos = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim() === '') {
            return res.json([]);
        }

        const searchTerm = `%${search}%`;

        const productos = await sequelize.query(`
            SELECT TOP 20
                ls.ID_Lote_Stock,
                pc.PCO_Nombre_Comercial as nombre,
                pc.PCO_Codigo_Barras as codigoBarras,
                ls.LST_Costo_Unitario as precio,
                ls.LST_Cantidad_Actual as stock,
                ls.LST_Fecha_Vencimiento as vencimiento,
                ISNULL(pr.PROV_Nombre_Empresa, 'Sin proveedor') as proveedor
            FROM LotesStock ls
            INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
            LEFT JOIN Proveedores pr ON ls.ID_Proveedor = pr.ID_Proveedor
            WHERE ls.LST_Estado = 'Disponible'
                AND ls.LST_Cantidad_Actual > 0
                AND (
                    pc.PCO_Nombre_Comercial LIKE :search
                    OR pc.PCO_Codigo_Barras LIKE :search
                )
            ORDER BY pc.PCO_Nombre_Comercial
        `, {
            replacements: { search: searchTerm },
            type: QueryTypes.SELECT
        });

        res.json(productos);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({
            message: 'Error al buscar productos',
            error: error.message
        });
    }
};

// Buscar clientes
exports.searchClientes = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim() === '') {
            return res.json([]);
        }

        const searchTerm = `%${search}%`;

        const clientes = await sequelize.query(`
            SELECT TOP 10
                c.ID_Cliente,
                p.ID_Persona,
                p.PER_DNI as dni,
                p.PER_Nombre + ' ' + p.PER_Apellido as nombre,
                p.PER_Telefono as telefono,
                p.PER_Email as email,
                c.CLI_Puntos_Fidelidad as puntos
            FROM Clientes c
            INNER JOIN Personas p ON c.ID_Persona = p.ID_Persona
            WHERE 
                p.PER_DNI LIKE :search
                OR p.PER_Nombre LIKE :search
                OR p.PER_Apellido LIKE :search
            ORDER BY p.PER_Nombre
        `, {
            replacements: { search: searchTerm },
            type: QueryTypes.SELECT
        });

        res.json(clientes);
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        res.status(500).json({
            message: 'Error al buscar clientes',
            error: error.message
        });
    }
};

// Obtener detalle de una venta
exports.getVentaById = async (req, res) => {
    try {
        const { id } = req.params;

        const [venta] = await sequelize.query(`
            SELECT 
                v.ID_Venta,
                v.VEN_Numero_Boleta,
                v.VEN_Fecha_Hora,
                COALESCE(p.PER_Nombre + ' ' + p.PER_Apellido, 'Cliente General') as cliente,
                p.PER_DNI as dni,
                v.VEN_Subtotal as subtotal,
                v.VEN_IGV as igv,
                v.VEN_Descuento as descuento,
                v.VEN_Total_Venta as total,
                tp.TPA_Nombre as tipoPago,
                tc.TCO_Nombre as tipoComprobante
            FROM Ventas v
            LEFT JOIN Clientes c ON v.ID_Cliente = c.ID_Cliente
            LEFT JOIN Personas p ON c.ID_Persona = p.ID_Persona
            INNER JOIN TiposPago tp ON v.ID_Tipo_Pago = tp.ID_Tipo_Pago
            INNER JOIN TiposComprobante tc ON v.ID_Tipo_Comprobante = tc.ID_Tipo_Comprobante
            WHERE v.ID_Venta = :id
        `, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        if (!venta) {
            return res.status(404).json({
                message: 'Venta no encontrada'
            });
        }

        // ✅ DETALLE DE PRODUCTOS CON NOMBRE DE COLUMNA CORRECTO
        const productos = await sequelize.query(`
            SELECT 
                dv.ID_Lote_Stock,
                pc.PCO_Nombre_Comercial as producto,
                dv.DVE_Cantidad as cantidad,
                dv.DVE_Precio_Unitario_Venta as precioUnitario,
                dv.DVE_Subtotal as subtotal
            FROM DetalleVenta dv
            INNER JOIN LotesStock ls ON dv.ID_Lote_Stock = ls.ID_Lote_Stock
            INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
            WHERE dv.ID_Venta = :id
        `, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        res.json({
            ...venta,
            productos
        });

    } catch (error) {
        console.error('Error al obtener detalle de venta:', error);
        res.status(500).json({
            message: 'Error al obtener detalle de venta',
            error: error.message
        });
    }
};

module.exports = exports;