const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ProductoComercial = require('./ProductoComercial');
const Proveedor = require('./Proveedor');
const Empleado = require('./Empleado');

const LoteStock = sequelize.define('LoteStock', {
    ID_Lote_Stock: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        field: 'ID_Lote_Stock'
    },
    ID_Producto: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: ProductoComercial,
            key: 'ID_Producto'
        },
        field: 'ID_Producto'
    },
    ID_Proveedor: {
        type: DataTypes.STRING(50),
        references: {
            model: Proveedor,
            key: 'ID_Proveedor'
        },
        field: 'ID_Proveedor'
    },
    ID_Empleado_Recibio: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: 'Empleados',
            key: 'ID_Empleado'
        },
        field: 'ID_Empleado_Recibio'
    },
    LST_Numero_Lote: {
        type: DataTypes.STRING(100),
        field: 'LST_Numero_Lote'
    },
    LST_Fecha_Vencimiento: {
        type: DataTypes.DATEONLY,
        field: 'LST_Fecha_Vencimiento'
    },
    LST_Fecha_Recepcion: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        field: 'LST_Fecha_Recepcion'
    },
    LST_Costo_Unitario: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'LST_Costo_Unitario'
    },
    LST_Cantidad_Inicial: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'LST_Cantidad_Inicial'
    },
    LST_Cantidad_Actual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'LST_Cantidad_Actual'
    },
    LST_Ubicacion_Stock: {
        type: DataTypes.STRING(100),
        field: 'LST_Ubicacion_Stock'
    },
    LST_Estado: {
        type: DataTypes.STRING(20),
        defaultValue: 'Disponible',
        field: 'LST_Estado'
    }
}, {
    tableName: 'LotesStock',
    schema: 'dbo',
    timestamps: false,
    freezeTableName: true
});

LoteStock.belongsTo(ProductoComercial, { foreignKey: 'ID_Producto' });
LoteStock.belongsTo(Proveedor, { foreignKey: 'ID_Proveedor' });
LoteStock.belongsTo(Empleado, { foreignKey: 'ID_Empleado_Recibio' });

module.exports = LoteStock;

