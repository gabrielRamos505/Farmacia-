const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PrincipioActivo = require('./PrincipioActivo');

const ProductoComercial = sequelize.define('ProductoComercial', {
    ID_Producto: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        field: 'ID_Producto'
    },
    PCO_Codigo_Barras: {
        type: DataTypes.STRING(50),
        unique: true,
        field: 'PCO_Codigo_Barras'
    },
    ID_Principio_Activo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: PrincipioActivo,
            key: 'ID_Principio_Activo'
        },
        field: 'ID_Principio_Activo'
    },
    PCO_Nombre_Comercial: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'PCO_Nombre_Comercial'
    },
    PCO_Laboratorio: {
        type: DataTypes.STRING(255),
        field: 'PCO_Laboratorio'
    },
    PCO_Presentacion: {
        type: DataTypes.STRING(100),
        field: 'PCO_Presentacion'
    },
    PCO_Precio_Venta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'PCO_Precio_Venta'
    },
    PCO_Requiere_Receta: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'PCO_Requiere_Receta'
    },
    PCO_Stock_Minimo: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        field: 'PCO_Stock_Minimo'
    },
    PCO_Estado: {
        type: DataTypes.STRING(20),
        defaultValue: 'Activo',
        field: 'PCO_Estado'
    }
}, {
    tableName: 'ProductosComerciales',
    schema: 'dbo',
    timestamps: false,
    freezeTableName: true
});

ProductoComercial.belongsTo(PrincipioActivo, { foreignKey: 'ID_Principio_Activo' });

module.exports = ProductoComercial;
