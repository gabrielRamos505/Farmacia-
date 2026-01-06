const Empleado = require('../models/Empleado');  // Modelo original
const Persona = require('../models/Persona');
const Puesto = require('../models/Puesto');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios con sus relaciones
exports.getAll = async (req, res) => {
    try {
        const usuarios = await Empleado.findAll({
            include: [
                {
                    model: Persona,
                    attributes: ['PER_DNI', 'PER_Nombre', 'PER_Apellido', 'PER_Telefono', 'PER_Email']
                },
                {
                    model: Puesto,
                    attributes: ['PUE_Nombre']
                }
            ],
            order: [[Persona, 'PER_Nombre', 'ASC']]
        });

        // Formatear respuesta para el frontend
        const usuariosFormateados = usuarios.map(emp => ({
            id: emp.ID_Empleado,
            dni: emp.Persona?.PER_DNI || '',
            nombre: emp.Persona?.PER_Nombre || '',
            apellido: emp.Persona?.PER_Apellido || '',
            usuario: emp.EMP_Usuario,
            puesto: emp.Puesto?.PUE_Nombre || '',
            telefono: emp.Persona?.PER_Telefono || '',
            email: emp.Persona?.PER_Email || '',
            estado: emp.EMP_Estado,
            salario: emp.EMP_Salario,
            fechaContratacion: emp.EMP_Fecha_Contratacion,
            fechaBaja: emp.EMP_Fecha_Baja
        }));

        res.json(usuariosFormateados);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// Obtener usuario por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await Empleado.findByPk(id, {
            include: [
                {
                    model: Persona,
                    attributes: ['PER_DNI', 'PER_Nombre', 'PER_Apellido', 'PER_Telefono', 'PER_Email']
                },
                {
                    model: Puesto,
                    attributes: ['PUE_Nombre']
                }
            ]
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const usuarioFormateado = {
            id: usuario.ID_Empleado,
            dni: usuario.Persona?.PER_DNI || '',
            nombre: usuario.Persona?.PER_Nombre || '',
            apellido: usuario.Persona?.PER_Apellido || '',
            usuario: usuario.EMP_Usuario,
            puesto: usuario.Puesto?.PUE_Nombre || '',
            telefono: usuario.Persona?.PER_Telefono || '',
            email: usuario.Persona?.PER_Email || '',
            estado: usuario.EMP_Estado,
            salario: usuario.EMP_Salario,
            fechaContratacion: usuario.EMP_Fecha_Contratacion
        };

        res.json(usuarioFormateado);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
};

// Crear nuevo usuario
exports.create = async (req, res) => {
    try {
        const { dni, nombre, apellido, usuario, password, puesto, telefono, email, estado, salario } = req.body;

        // Validaciones
        if (!dni || !nombre || !apellido || !usuario || !password || !puesto) {
            return res.status(400).json({
                message: 'Faltan campos requeridos: dni, nombre, apellido, usuario, password, puesto'
            });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await Empleado.findOne({
            where: { EMP_Usuario: usuario }
        });

        if (usuarioExistente) {
            return res.status(400).json({ message: 'El nombre de usuario ya existe' });
        }

        // 1. Crear Persona primero
        const personaId = `PER_${Date.now()}`;
        await Persona.create({
            ID_Persona: personaId,
            PER_DNI: dni,
            PER_Nombre: nombre,
            PER_Apellido: apellido,
            PER_Telefono: telefono || null,
            PER_Email: email || null
        });

        // 2. Buscar o crear el puesto
        let puestoEncontrado = await Puesto.findOne({
            where: { PUE_Nombre: puesto }
        });

        // Si no existe el puesto, crearlo
        if (!puestoEncontrado) {
            const puestoId = `PUE_${Date.now()}`;
            puestoEncontrado = await Puesto.create({
                ID_Puesto: puestoId,
                PUE_Nombre: puesto
            });
        }

        // 3. Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Crear empleado usando el ID del puesto encontrado o creado
        const empleadoId = `EMP_${Date.now()}`;
        await Empleado.create({
            ID_Empleado: empleadoId,
            ID_Persona: personaId,
            ID_Puesto: puestoEncontrado.ID_Puesto,
            EMP_Usuario: usuario,
            EMP_Contrasena_Hash: hashedPassword,
            EMP_Es_Administrador: puesto === 'Gerente',
            EMP_Estado: estado || 'Activo',
            EMP_Salario: salario || 0,
            EMP_Fecha_Contratacion: new Date()
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            id: empleadoId
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario', error: error.message });
    }
};

// Actualizar usuario
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { dni, nombre, apellido, usuario, password, puesto, telefono, email, estado, salario } = req.body;

        const empleado = await Empleado.findByPk(id, {
            include: [Persona, Puesto]
        });

        if (!empleado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar Persona
        if (empleado.Persona) {
            await empleado.Persona.update({
                PER_DNI: dni,
                PER_Nombre: nombre,
                PER_Apellido: apellido,
                PER_Telefono: telefono || null,
                PER_Email: email || null
            });
        }

        // Actualizar Empleado
        const datosEmpleado = {
            EMP_Usuario: usuario,
            EMP_Estado: estado,
            EMP_Salario: salario,
            EMP_Es_Administrador: puesto === 'Gerente'
        };

        // Si hay contraseña nueva, hashearla
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            datosEmpleado.EMP_Contrasena_Hash = hashedPassword;
        }

        // Actualizar puesto si cambió
        if (puesto !== empleado.Puesto?.PUE_Nombre) {
            const puestoEncontrado = await Puesto.findOne({
                where: { PUE_Nombre: puesto }
            });
            if (puestoEncontrado) {
                datosEmpleado.ID_Puesto = puestoEncontrado.ID_Puesto;
            }
        }

        await empleado.update(datosEmpleado);

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
    }
};

// Eliminar usuario (Ahora realiza una Baja lógica)
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const empleado = await Empleado.findByPk(id);

        if (!empleado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // En lugar de destroy, actualizamos el estado y la fecha de baja
        await empleado.update({
            EMP_Estado: 'Inactivo',
            EMP_Fecha_Baja: new Date()
        });

        res.json({ message: 'Empleado dado de baja exitosamente' });
    } catch (error) {
        console.error('Error al dar de baja usuario:', error);
        res.status(500).json({ message: 'Error al dar de baja usuario', error: error.message });
    }
};
