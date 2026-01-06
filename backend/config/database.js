const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mssql',
    logging: false,
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true // Importante para desarrollo local
      }
    },
    define: {
      timestamps: false,
      freezeTableName: true
    }
  }
);

module.exports = sequelize;
