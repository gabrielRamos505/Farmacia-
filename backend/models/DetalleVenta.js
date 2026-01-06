const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleVenta = sequelize.define('DetalleVenta', {
    ID_Venta: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'Ventas',
            key: 'ID_Venta'
        },
        field: 'ID_Venta'
    },
    ID_Lote_Stock: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'LotesStock',
            key: 'ID_Lote_Stock'
        },
        field: 'ID_Lote_Stock'
    },
    DVE_Cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        },
        field: 'DVE_Cantidad'
    },
    DVE_Precio_Unitario_Venta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'DVE_Precio_Unitario_Venta'
    },
    DVE_Subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'DVE_Subtotal'
    }
}, {
    tableName: 'DetalleVenta',
    schema: 'dbo',
    timestamps: false,
    freezeTableName: true
});

module.exports = DetalleVenta;
