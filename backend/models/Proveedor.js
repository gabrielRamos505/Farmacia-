const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
    ID_Proveedor: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        field: 'ID_Proveedor'
    },
    PROV_Nombre_Empresa: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'PROV_Nombre_Empresa'
    },
    PROV_Telefono: {
        type: DataTypes.STRING(20),
        field: 'PROV_Telefono'
    },
    PROV_Contacto: {
        type: DataTypes.STRING(255),
        field: 'PROV_Contacto'
    }
}, {
    tableName: 'Proveedores',
    timestamps: false,
    freezeTableName: true
});

module.exports = Proveedor;
