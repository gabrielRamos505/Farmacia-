// controllers/authController.js
const Empleado = require('../models/Empleado');
const Persona = require('../models/Persona');
const Puesto = require('../models/Puesto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Buscar empleado por usuario
    const empleado = await Empleado.findOne({
      where: { EMP_Usuario: usuario },
      include: [
        { model: Persona },
        { model: Puesto }
      ]
    });

    if (!empleado) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Comparar contraseña
    // Para datos de prueba permites 'admin123' directo
    const isMatch =
      password === 'admin123' ||
      await bcrypt.compare(password, empleado.EMP_Contrasena_Hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: empleado.ID_Empleado,                     // ID_Empleado (clave para lotes)
        isAdmin: empleado.EMP_Es_Administrador,       // bool
        puesto: empleado.Puesto?.PUE_Nombre || ''     // rol (Gerente, Farmacéutico, etc.)
      },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '24h' }
    );

    // Respuesta con datos del usuario (se guarda en localStorage en el frontend)
    res.json({
      token,
      user: {
        id: empleado.ID_Empleado,
        nombre: empleado.Persona?.PER_Nombre,
        apellido: empleado.Persona?.PER_Apellido,
        usuario: empleado.EMP_Usuario,
        isAdmin: empleado.EMP_Es_Administrador,
        puesto: empleado.Puesto?.PUE_Nombre || ''
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
