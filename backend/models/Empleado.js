const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Persona = require('./Persona');
const Puesto = require('./Puesto');

const Empleado = sequelize.define('Empleados', {
  ID_Empleado: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  ID_Persona: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    references: {
      model: Persona,
      key: 'ID_Persona'
    }
  },
  ID_Puesto: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'Puestos',
      key: 'ID_Puesto'
    }
  },
  EMP_Fecha_Contratacion: {
    type: DataTypes.DATEONLY
  },
  EMP_Usuario: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  EMP_Contrasena_Hash: {
    type: DataTypes.CHAR(60),
    allowNull: false
  },
  EMP_Es_Administrador: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  EMP_Salario: {
    type: DataTypes.DECIMAL(10, 2)
  },
  EMP_Estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo', 'Suspendido', 'Vacaciones'),
    defaultValue: 'Activo'
  },
  EMP_Fecha_Baja: {
    type: DataTypes.DATEONLY
  }
});

Empleado.belongsTo(Persona, { foreignKey: 'ID_Persona' });
Empleado.belongsTo(Puesto, { foreignKey: 'ID_Puesto' });

module.exports = Empleado;
