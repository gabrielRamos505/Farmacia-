const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Puesto = sequelize.define('Puestos', {
  ID_Puesto: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  PUE_Nombre: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  }
});

module.exports = Puesto;
