const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrincipioActivo = sequelize.define('PrincipioActivo', {
    ID_Principio_Activo: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        field: 'ID_Principio_Activo'
    },
    PAC_Nombre_Base: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'PAC_Nombre_Base'
    },
    PAC_Descripcion_Cientifica: {
        type: DataTypes.STRING(500),
        field: 'PAC_Descripcion_Cientifica'
    }
}, {
    tableName: 'PrincipiosActivos',
    schema: 'dbo',
    timestamps: false,
    freezeTableName: true
});

module.exports = PrincipioActivo;
