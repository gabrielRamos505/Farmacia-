const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Obtener productos disponibles para POS
exports.getProductosDisponibles = async (req, res) => {
    try {
        const productos = await sequelize.query(`
            SELECT 
                pc.ID_Producto,
                pc.PCO_Nombre_Comercial as Nombre,
                pc.PCO_Codigo_Barras as Codigo_Barras,
                CAST(pc.PCO_Precio_Venta AS FLOAT) as Precio,
                ISNULL(SUM(ls.LST_Cantidad_Actual), 0) as Stock,
                pc.PCO_Laboratorio as Laboratorio,
                pc.PCO_Requiere_Receta as Requiere_Receta,
                ls.ID_Lote_Stock
            FROM ProductosComerciales pc
            INNER JOIN LotesStock ls ON pc.ID_Producto = ls.ID_Producto
            WHERE pc.PCO_Estado = 'Activo' 
                AND ls.LST_Estado = 'Disponible'
                AND ls.LST_Cantidad_Actual > 0
            GROUP BY 
                pc.ID_Producto, pc.PCO_Nombre_Comercial, pc.PCO_Codigo_Barras, 
                pc.PCO_Precio_Venta, pc.PCO_Laboratorio, pc.PCO_Requiere_Receta,
                ls.ID_Lote_Stock
            ORDER BY pc.PCO_Nombre_Comercial ASC
        `, { type: QueryTypes.SELECT });

        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos disponibles:', error);
        res.status(500).json({ message: 'Error al obtener productos disponibles' });
    }
};

// Buscar productos para POS
exports.searchProducts = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim().length < 2) {
            return res.json([]);
        }

        const searchTerm = `%${search}%`;

        const productos = await sequelize.query(`
            SELECT 
                pc.ID_Producto,
                pc.PCO_Nombre_Comercial as Nombre,
                pc.PCO_Codigo_Barras as Codigo_Barras,
                CAST(pc.PCO_Precio_Venta AS FLOAT) as Precio,
                ISNULL(SUM(ls.LST_Cantidad_Actual), 0) as Stock,
                pc.PCO_Laboratorio as Laboratorio,
                pc.PCO_Requiere_Receta as Requiere_Receta,
                MIN(ls.ID_Lote_Stock) as ID_Lote_Stock
            FROM ProductosComerciales pc
            LEFT JOIN LotesStock ls ON pc.ID_Producto = ls.ID_Producto 
                AND ls.LST_Estado = 'Disponible'
            WHERE (pc.PCO_Nombre_Comercial LIKE :search OR pc.PCO_Codigo_Barras LIKE :search)
                AND pc.PCO_Estado = 'Activo'
            GROUP BY 
                pc.ID_Producto, pc.PCO_Nombre_Comercial, pc.PCO_Codigo_Barras, 
                pc.PCO_Precio_Venta, pc.PCO_Laboratorio, pc.PCO_Requiere_Receta
            ORDER BY pc.PCO_Nombre_Comercial ASC
        `, {
            replacements: { search: searchTerm },
            type: QueryTypes.SELECT
        });

        res.json(productos);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({ message: 'Error al buscar productos' });
    }
};

// Crear nueva venta
exports.createSale = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            clienteId,
            productos, // Array de { idLote, cantidad, precioUnitario }
            subtotal,
            igv,
            total,
            tipoPago // ID del tipo de pago
        } = req.body;

        // Validaciones
        if (!productos || productos.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Debe agregar al menos un producto' });
        }

        // Obtener ID de empleado de la sesión (req.user viene del authMiddleware)
        const empleadoId = req.user?.empleadoId;
        if (!empleadoId) {
            await transaction.rollback();
            return res.status(401).json({ message: 'Usuario no identificado' });
        }

        // Generar IDs
        const ventaId = `VEN-${uuidv4()}`;

        // Generar número de boleta secuencial similar a ventasController.js
        const lastBoleta = await sequelize.query(`
            SELECT TOP 1 VEN_Numero_Boleta 
            FROM Ventas 
            WHERE VEN_Numero_Boleta LIKE 'B002-%'
            ORDER BY VEN_Numero_Boleta DESC
        `, { type: QueryTypes.SELECT, transaction });

        let nextNumber = 1;
        if (lastBoleta.length > 0 && lastBoleta[0].VEN_Numero_Boleta) {
            const parts = lastBoleta[0].VEN_Numero_Boleta.split('-');
            if (parts.length > 1) {
                nextNumber = parseInt(parts[1]) + 1;
            }
        }
        const boletaNumber = `B002-${String(nextNumber).padStart(6, '0')}`;

        // Obtener tipo comprobante (Boleta)
        const tipoComprobante = await sequelize.query(`
            SELECT TOP 1 ID_Tipo_Comprobante FROM TiposComprobante WHERE TCO_Nombre = 'Boleta'
        `, { type: QueryTypes.SELECT, transaction });

        const idTipoComprobante = tipoComprobante.length > 0 ? tipoComprobante[0].ID_Tipo_Comprobante : 'TCO-001';

        // 1. Insertar Venta
        await sequelize.query(`
            INSERT INTO Ventas (
                ID_Venta, VEN_Numero_Boleta, ID_Tipo_Comprobante, VEN_Fecha_Hora,
                ID_Empleado, ID_Cliente, ID_Tipo_Pago, VEN_Subtotal, VEN_IGV,
                VEN_Descuento, VEN_Total_Venta
            ) VALUES (
                :ventaId, :boletaNumber, :idTipoComprobante, GETDATE(),
                :empleadoId, :clienteId, :idTipoPago, :subtotal, :igv,
                0, :total
            )
        `, {
            replacements: {
                ventaId, boletaNumber, idTipoComprobante,
                empleadoId, clienteId: clienteId || null,
                idTipoPago: tipoPago || 'TPA_EFECTIVO',
                subtotal, igv: igv || (total * 0.18),
                total
            },
            transaction
        });

        // 2. Insertar Detalles y Actualizar Stock
        for (const item of productos) {
            await sequelize.query(`
                INSERT INTO DetalleVenta (
                    ID_Venta, ID_Lote_Stock, DVE_Cantidad, 
                    DVE_Precio_Unitario_Venta, DVE_Subtotal
                ) VALUES (
                    :ventaId, :idLote, :cantidad, :precio, :sub
                )
            `, {
                replacements: {
                    ventaId,
                    idLote: item.idLote,
                    cantidad: item.cantidad,
                    precio: item.precioUnitario,
                    sub: item.cantidad * item.precioUnitario
                },
                transaction
            });

            // Actualizar stock
            await sequelize.query(`
                UPDATE LotesStock 
                SET LST_Cantidad_Actual = LST_Cantidad_Actual - :cantidad,
                    LST_Estado = CASE WHEN LST_Cantidad_Actual - :cantidad <= 0 THEN 'Agotado' ELSE LST_Estado END
                WHERE ID_Lote_Stock = :idLote
            `, {
                replacements: {
                    cantidad: item.cantidad,
                    idLote: item.idLote
                },
                transaction
            });
        }

        // Actualizar puntos si hay cliente
        if (clienteId) {
            const puntos = Math.floor(total / 10);
            await sequelize.query(`
                UPDATE Clientes SET CLI_Puntos_Fidelidad = CLI_Puntos_Fidelidad + :puntos
                WHERE ID_Cliente = :clienteId
            `, {
                replacements: { puntos, clienteId },
                transaction
            });
        }

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            ventaId,
            boletaNumber
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error al crear venta POS:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar venta',
            error: error.message
        });
    }
};

// Obtener comprobante de venta
exports.getReceipt = async (req, res) => {
    try {
        const { ventaId } = req.params;

        const [venta] = await sequelize.query(`
            SELECT 
                v.ID_Venta, v.VEN_Numero_Boleta, v.VEN_Fecha_Hora,
                COALESCE(p.PER_Nombre + ' ' + p.PER_Apellido, 'Cliente General') as Cliente,
                v.VEN_Total_Venta as Total,
                tp.TPA_Nombre as MetodoPago
            FROM Ventas v
            LEFT JOIN Clientes c ON v.ID_Cliente = c.ID_Cliente
            LEFT JOIN Personas p ON c.ID_Persona = p.ID_Persona
            INNER JOIN TiposPago tp ON v.ID_Tipo_Pago = tp.ID_Tipo_Pago
            WHERE v.ID_Venta = :ventaId
        `, {
            replacements: { ventaId },
            type: QueryTypes.SELECT
        });

        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        const productos = await sequelize.query(`
            SELECT 
                pc.PCO_Nombre_Comercial as Producto,
                dv.DVE_Cantidad as Cantidad,
                dv.DVE_Precio_Unitario_Venta as Precio,
                dv.DVE_Subtotal as Subtotal
            FROM DetalleVenta dv
            INNER JOIN LotesStock ls ON dv.ID_Lote_Stock = ls.ID_Lote_Stock
            INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
            WHERE dv.ID_Venta = :ventaId
        `, {
            replacements: { ventaId },
            type: QueryTypes.SELECT
        });

        res.json({
            ...venta,
            Productos: productos
        });
    } catch (error) {
        console.error('Error al obtener comprobante:', error);
        res.status(500).json({ message: 'Error al obtener comprobante' });
    }
};

module.exports = exports;
