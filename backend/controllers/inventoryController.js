const Producto = require('../models/Producto');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

exports.getAll = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            where: { PCO_Estado: 'Activo' },
            order: [['PCO_Nombre_Comercial', 'ASC']]
        });
        res.json(productos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};

exports.getById = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener producto' });
    }
};

exports.getLowStock = async (req, res) => {
    try {
        // ✅ CORREGIDO: El stock se calcula sumando las cantidades de los lotes activos
        const productos = await sequelize.query(`
            SELECT 
                pc.ID_Producto,
                pc.PCO_Nombre_Comercial,
                pc.PCO_Laboratorio,
                pc.PCO_Presentacion,
                pc.PCO_Precio_Venta,
                pc.PCO_Stock_Minimo,
                ISNULL(SUM(ls.LST_Cantidad_Actual), 0) as stockActual
            FROM ProductosComerciales pc
            LEFT JOIN LotesStock ls ON pc.ID_Producto = ls.ID_Producto 
                AND ls.LST_Estado = 'Disponible'
            WHERE pc.PCO_Estado = 'Activo'
            GROUP BY 
                pc.ID_Producto,
                pc.PCO_Nombre_Comercial,
                pc.PCO_Laboratorio,
                pc.PCO_Presentacion,
                pc.PCO_Precio_Venta,
                pc.PCO_Stock_Minimo
            HAVING ISNULL(SUM(ls.LST_Cantidad_Actual), 0) <= pc.PCO_Stock_Minimo
                OR ISNULL(SUM(ls.LST_Cantidad_Actual), 0) <= 10
            ORDER BY stockActual ASC
        `, { type: QueryTypes.SELECT });

        res.json(productos);
    } catch (error) {
        console.error('Error al obtener stock bajo:', error);
        res.status(500).json({ message: 'Error al obtener productos con stock bajo' });
    }
};

exports.create = async (req, res) => {
    try {
        const producto = await Producto.create(req.body);
        res.status(201).json(producto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear producto' });
    }
};

exports.update = async (req, res) => {
    try {
        const [updated] = await Producto.update(req.body, {
            where: { ID_Producto: req.params.id }
        });
        if (!updated) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        const producto = await Producto.findByPk(req.params.id);
        res.json(producto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar producto' });
    }
};

module.exports = exports;
