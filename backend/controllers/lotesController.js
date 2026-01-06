const LoteStock = require('../models/LoteStock');
const ProductoComercial = require('../models/ProductoComercial');
const Proveedor = require('../models/Proveedor');
const sequelize = require('../config/database');

// Obtener todos los lotes
exports.getAll = async (req, res) => {
    try {
        const lotes = await LoteStock.findAll({
            include: [
                {
                    model: ProductoComercial,
                    attributes: ['ID_Producto', 'PCO_Nombre_Comercial', 'PCO_Presentacion']
                },
                {
                    model: Proveedor,
                    attributes: ['ID_Proveedor', 'PROV_Nombre_Empresa']
                }
            ],
            order: [['LST_Fecha_Recepcion', 'DESC']]
        });

        const lotesFormateados = lotes.map(lote => ({
            ID_Lote: lote.ID_Lote_Stock,
            Producto: lote.ProductoComercial?.PCO_Nombre_Comercial || 'Sin producto',
            Proveedor: lote.Proveedor?.PROV_Nombre_Empresa || 'Sin proveedor',
            Numero_Lote: lote.LST_Numero_Lote,
            Fecha_Vencimiento: lote.LST_Fecha_Vencimiento,
            Fecha_Recepcion: lote.LST_Fecha_Recepcion,
            Cantidad_Inicial: lote.LST_Cantidad_Inicial,
            Cantidad_Actual: lote.LST_Cantidad_Actual,
            Costo_Unitario: lote.LST_Costo_Unitario,
            Ubicacion: lote.LST_Ubicacion_Stock,
            Estado: lote.LST_Estado,
            ID_Producto: lote.ID_Producto
        }));

        res.json(lotesFormateados);
    } catch (error) {
        console.error('Error al obtener lotes:', error);
        res.status(500).json({ message: 'Error al obtener lotes' });
    }
};

// Obtener lotes por producto
exports.getByProducto = async (req, res) => {
    try {
        const { productoId } = req.params;

        const lotes = await LoteStock.findAll({
            where: {
                ID_Producto: productoId,
                LST_Estado: 'Disponible'
            },
            include: [
                {
                    model: Proveedor,
                    attributes: ['PROV_Nombre_Empresa']
                }
            ],
            order: [['LST_Fecha_Vencimiento', 'ASC']]
        });

        res.json(lotes);
    } catch (error) {
        console.error('Error al obtener lotes:', error);
        res.status(500).json({ message: 'Error al obtener lotes' });
    }
};

// Crear nuevo lote
exports.create = async (req, res) => {
    try {
        const {
            productoId,
            proveedorId,
            numeroLote,
            fechaVencimiento,
            cantidad,
            costoUnitario,
            ubicacion
        } = req.body;

        // Validaciones básicas
        if (!productoId || !cantidad || !costoUnitario) {
            return res.status(400).json({
                message: 'Producto, cantidad y costo son requeridos'
            });
        }

        // Validar que el middleware haya puesto el empleado
        if (!req.user || !req.user.empleadoId) {
            return res.status(401).json({
                message: 'No se pudo identificar al empleado que recibe el lote'
            });
        }

        // Verificar que el producto existe
        const producto = await ProductoComercial.findByPk(productoId);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Crear lote
        const loteId = `LOTE-${Date.now()}`;
        await LoteStock.create({
            ID_Lote_Stock: loteId,
            ID_Producto: productoId,
            ID_Proveedor: proveedorId || null,
            ID_Empleado_Recibio: req.user.empleadoId, // YA NO ES NULL
            LST_Numero_Lote: numeroLote || `LOTE-${Date.now()}`,
            LST_Fecha_Vencimiento: fechaVencimiento || null,
            LST_Fecha_Recepcion: new Date(),
            LST_Costo_Unitario: costoUnitario,
            LST_Cantidad_Inicial: cantidad,
            LST_Cantidad_Actual: cantidad,
            LST_Ubicacion_Stock: ubicacion || 'Almacén General',
            LST_Estado: 'Disponible'
        });

        res.status(201).json({
            message: 'Lote registrado exitosamente',
            id: loteId
        });
    } catch (error) {
        console.error('Error al crear lote:', error);
        res.status(500).json({
            message: 'Error al crear lote',
            error: error.message
        });
    }
};

// Actualizar lote
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            numeroLote,
            fechaVencimiento,
            ubicacion,
            estado
        } = req.body;

        const lote = await LoteStock.findByPk(id);

        if (!lote) {
            return res.status(404).json({ message: 'Lote no encontrado' });
        }

        await lote.update({
            LST_Numero_Lote: numeroLote,
            LST_Fecha_Vencimiento: fechaVencimiento,
            LST_Ubicacion_Stock: ubicacion,
            LST_Estado: estado
        });

        res.json({ message: 'Lote actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar lote:', error);
        res.status(500).json({
            message: 'Error al actualizar lote',
            error: error.message
        });
    }
};

// Obtener lotes próximos a vencer
exports.getProximosVencer = async (req, res) => {
    try {
        const diasLimite = parseInt(req.query.dias, 10) || 30;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + diasLimite);

        const { Op } = sequelize.Sequelize;

        const lotes = await LoteStock.findAll({
            where: {
                LST_Estado: 'Disponible',
                LST_Fecha_Vencimiento: {
                    [Op.lte]: fechaLimite,
                    [Op.gte]: new Date()
                }
            },
            include: [
                {
                    model: ProductoComercial,
                    attributes: ['PCO_Nombre_Comercial']
                }
            ],
            order: [['LST_Fecha_Vencimiento', 'ASC']]
        });

        res.json(lotes);
    } catch (error) {
        console.error('Error al obtener lotes próximos a vencer:', error);
        res.status(500).json({ message: 'Error al obtener lotes' });
    }
};
