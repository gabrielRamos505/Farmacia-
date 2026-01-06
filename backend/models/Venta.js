const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venta = sequelize.define('Ventas', {
  ID_Venta: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  VEN_Numero_Boleta: {
    type: DataTypes.STRING(20),
    unique: true
  },
  ID_Tipo_Comprobante: {
    type: DataTypes.STRING(50)
  },
  VEN_Fecha_Hora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ID_Empleado: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ID_Cliente: {
    type: DataTypes.STRING(50)
  },
  ID_Tipo_Pago: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  VEN_Subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  VEN_IGV: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  VEN_Descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  VEN_Total_Venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = Venta;
