const sequelize = require('../config/database');
const Persona = require('../models/Persona');
const Puesto = require('../models/Puesto');
const Empleado = require('../models/Empleado');
const Producto = require('../models/Producto');
const Venta = require('../models/Venta');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.sync({ force: true });

    // Puestos
    const puestos = await Puesto.bulkCreate([
      { ID_Puesto: 'PUE-001', PUE_Nombre: 'Gerente' },
      { ID_Puesto: 'PUE-002', PUE_Nombre: 'Farmacéutico' },
      { ID_Puesto: 'PUE-003', PUE_Nombre: 'Cajero' }
    ]);

    // Persona Admin
    const personaAdmin = await Persona.create({
      ID_Persona: 'PER-0001',
      PER_DNI: '12345678',
      PER_Nombre: 'Admin',
      PER_Apellido: 'Sistema',
      PER_Email: 'admin@farmacia.com'
    });

    // Empleado Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await Empleado.create({
      ID_Empleado: 'EMP-001',
      ID_Persona: 'PER-0001',
      ID_Puesto: 'PUE-001',
      EMP_Usuario: 'admin',
      EMP_Contrasena_Hash: hashedPassword,
      EMP_Es_Administrador: true,
      EMP_Estado: 'Activo'
    });

    // Productos
    await Producto.bulkCreate([
      { ID_Producto: 'PROD-001', PCO_Nombre_Comercial: 'Paracetamol 500mg', PCO_Precio_Venta: 5.50, ID_Principio_Activo: 'PA-001' },
      { ID_Producto: 'PROD-002', PCO_Nombre_Comercial: 'Amoxicilina 1g', PCO_Precio_Venta: 15.00, ID_Principio_Activo: 'PA-002' },
      { ID_Producto: 'PROD-003', PCO_Nombre_Comercial: 'Ibuprofeno 400mg', PCO_Precio_Venta: 8.20, ID_Principio_Activo: 'PA-003' }
    ]);

    console.log('Datos de prueba insertados correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al insertar datos:', error);
    process.exit(1);
  }
}

seed();
