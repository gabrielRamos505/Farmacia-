const Venta = require('../models/Venta');
const { Sequelize } = require('sequelize');

exports.getAll = async (req, res) => {
    try {
        const ventas = await Venta.findAll({
            order: [['VEN_Fecha_Hora', 'DESC']],
            limit: 100
        });
        res.json(ventas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener ventas' });
    }
};

exports.getById = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id);
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        res.json(venta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener venta' });
    }
};

exports.getSummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const summary = await Venta.findAll({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('ID_Venta')), 'totalVentas'],
                [Sequelize.fn('SUM', Sequelize.col('VEN_Total_Venta')), 'totalIngresos'],
                [Sequelize.fn('AVG', Sequelize.col('VEN_Total_Venta')), 'promedioVenta']
            ],
            where: {
                VEN_Fecha_Hora: {
                    [Sequelize.Op.gte]: today
                }
            }
        });

        res.json(summary[0] || { totalVentas: 0, totalIngresos: 0, promedioVenta: 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener resumen de ventas' });
    }
};

exports.create = async (req, res) => {
    try {
        const venta = await Venta.create(req.body);
        res.status(201).json(venta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear venta' });
    }
};

module.exports = exports;
