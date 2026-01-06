const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const sequelize = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const usersRoutes = require('./routes/usersRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const productosRoutes = require('./routes/productosRoutes');
const lotesRoutes = require('./routes/lotesRoutes');
const proveedoresRoutes = require('./routes/proveedoresRoutes');
const posRoutes = require('./routes/posRoutes');
const ventasRoutes = require('./routes/ventasRoutes');



const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/ventas', ventasRoutes);


const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✓ Conectado a SQL Server: ' + process.env.DB_NAME);
    app.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('✗ Error al conectar a la base de datos:', err.message);
  });
