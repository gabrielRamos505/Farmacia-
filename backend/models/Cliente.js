const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Persona = require('./Persona');

const Cliente = sequelize.define('Cliente', {
    ID_Cliente: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        field: 'ID_Cliente'
    },
    ID_Persona: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        references: {
            model: Persona,
            key: 'ID_Persona'
        },
        field: 'ID_Persona'
    },
    CLI_Fecha_Registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'CLI_Fecha_Registro'
    },
    CLI_Puntos_Fidelidad: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'CLI_Puntos_Fidelidad'
    }
}, {
    tableName: 'Clientes',
    timestamps: false,
    freezeTableName: true
});

Cliente.belongsTo(Persona, { foreignKey: 'ID_Persona' });

module.exports = Cliente;
