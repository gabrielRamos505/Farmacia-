const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Persona = sequelize.define('Personas', {
  ID_Persona: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  PER_DNI: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  PER_Nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  PER_Apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  PER_Telefono: {
    type: DataTypes.STRING(20)
  },
  PER_Email: {
    type: DataTypes.STRING(100),
    unique: true
  },
  PER_Direccion: {
    type: DataTypes.STRING(255)
  }
});

module.exports = Persona;
