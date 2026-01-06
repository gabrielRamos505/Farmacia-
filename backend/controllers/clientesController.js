const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// Obtener todos los clientes
exports.getAll = async (req, res) => {
    try {
        const clientes = await sequelize.query(`
            SELECT 
                c.ID_Cliente,
                p.PER_DNI as dni,
                p.PER_Nombre as nombre,
                p.PER_Apellido as apellido,
                p.PER_Telefono as telefono,
                p.PER_Email as email,
                p.PER_Direccion as direccion,
                c.CLI_Fecha_Registro as fechaRegistro,
                c.CLI_Puntos_Fidelidad as puntos
            FROM Clientes c
            INNER JOIN Personas p ON c.ID_Persona = p.ID_Persona
            ORDER BY p.PER_Nombre ASC
        `, { type: QueryTypes.SELECT });

        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            message: 'Error al obtener clientes',
            error: error.message
        });
    }
};

// Obtener cliente por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const [cliente] = await sequelize.query(`
            SELECT 
                c.ID_Cliente,
                c.ID_Persona,
                p.PER_DNI as dni,
                p.PER_Nombre as nombre,
                p.PER_Apellido as apellido,
                p.PER_Telefono as telefono,
                p.PER_Email as email,
                p.PER_Direccion as direccion,
                c.CLI_Fecha_Registro as fechaRegistro,
                c.CLI_Puntos_Fidelidad as puntos
            FROM Clientes c
            INNER JOIN Personas p ON c.ID_Persona = p.ID_Persona
            WHERE c.ID_Cliente = :id
        `, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        res.json(cliente);
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({
            message: 'Error al obtener cliente',
            error: error.message
        });
    }
};

// Buscar cliente por DNI (para punto de venta)
exports.buscarPorDNI = async (req, res) => {
    try {
        const { dni } = req.params;

        const [cliente] = await sequelize.query(`
            SELECT 
                c.ID_Cliente,
                p.ID_Persona,
                p.PER_DNI as dni,
                p.PER_Nombre,
                p.PER_Apellido,
                p.PER_Telefono,
                p.PER_Email,
                p.PER_Direccion,
                c.CLI_Puntos_Fidelidad as puntos
            FROM Personas p
            INNER JOIN Clientes c ON p.ID_Persona = c.ID_Persona
            WHERE p.PER_DNI = :dni
        `, {
            replacements: { dni },
            type: QueryTypes.SELECT
        });

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            cliente: {
                ID_Cliente: cliente.ID_Cliente,
                ID_Persona: cliente.ID_Persona,
                dni: cliente.dni,
                nombre: `${cliente.PER_Nombre} ${cliente.PER_Apellido}`,
                PER_Nombre: cliente.PER_Nombre,
                PER_Apellido: cliente.PER_Apellido,
                PER_Telefono: cliente.PER_Telefono,
                PER_Email: cliente.PER_Email,
                PER_Direccion: cliente.PER_Direccion,
                puntos: cliente.puntos
            }
        });

    } catch (error) {
        console.error('Error al buscar cliente por DNI:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar cliente',
            error: error.message
        });
    }
};

// ✅ CORREGIDO: Crear cliente rápido con generación correcta de ID
exports.crearRapido = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { dni, nombre, apellido, telefono, email } = req.body;

        // Validaciones
        if (!dni || !nombre || !apellido) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'DNI, nombre y apellido son obligatorios'
            });
        }

        // ✅ VERIFICAR SI LA PERSONA YA EXISTE
        const [personaExistente] = await sequelize.query(`
            SELECT 
                p.ID_Persona,
                p.PER_DNI,
                p.PER_Nombre,
                p.PER_Apellido,
                p.PER_Telefono,
                p.PER_Email,
                c.ID_Cliente
            FROM Personas p
            LEFT JOIN Clientes c ON p.ID_Persona = c.ID_Persona
            WHERE p.PER_DNI = :dni
        `, {
            replacements: { dni },
            type: QueryTypes.SELECT,
            transaction
        });

        let nuevoIDCliente;
        let nuevoIDPersona;
        let nombreCompleto;
        let telefonoFinal;
        let emailFinal;

        // ✅ GENERAR ID_CLIENTE PRIMERO (antes de los condicionales)
        const [ultimoCliente] = await sequelize.query(`
            SELECT TOP 1 ID_Cliente 
            FROM Clientes 
            WHERE ID_Cliente LIKE 'CLI-%'
            ORDER BY ID_Cliente DESC
        `, { type: QueryTypes.SELECT, transaction });

        let nuevoNumeroCliente = 1;
        if (ultimoCliente && ultimoCliente.ID_Cliente) {
            const partes = ultimoCliente.ID_Cliente.split('-');
            if (partes.length > 1 && !isNaN(partes[1])) {
                nuevoNumeroCliente = parseInt(partes[1], 10) + 1;
            }
        }

        nuevoIDCliente = `CLI-${String(nuevoNumeroCliente).padStart(4, '0')}`;

        if (personaExistente) {
            // ✅ LA PERSONA YA EXISTE
            if (personaExistente.ID_Cliente) {
                // Ya tiene cliente asociado
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Este DNI ya está registrado como cliente'
                });
            }

            // ✅ PERSONA EXISTE PERO NO TIENE CLIENTE → Solo crear Cliente
            console.log('📋 Persona existe, creando solo Cliente para:', personaExistente.PER_DNI);
            console.log('   ID Cliente generado:', nuevoIDCliente);

            nuevoIDPersona = personaExistente.ID_Persona;
            nombreCompleto = `${personaExistente.PER_Nombre} ${personaExistente.PER_Apellido}`;
            telefonoFinal = personaExistente.PER_Telefono;
            emailFinal = personaExistente.PER_Email;

            // Crear solo Cliente
            await sequelize.query(`
                INSERT INTO Clientes (
                    ID_Cliente, 
                    ID_Persona, 
                    CLI_Fecha_Registro, 
                    CLI_Puntos_Fidelidad
                ) VALUES (
                    :idCliente, 
                    :idPersona, 
                    GETDATE(), 
                    0
                )
            `, {
                replacements: {
                    idCliente: nuevoIDCliente,
                    idPersona: nuevoIDPersona
                },
                transaction
            });

        } else {
            // ✅ LA PERSONA NO EXISTE → Crear Persona y Cliente
            console.log('✨ Persona nueva, creando Persona y Cliente:', dni);
            console.log('   ID Cliente generado:', nuevoIDCliente);

            // Verificar si el email ya existe (si se proporciona)
            if (email) {
                const [emailExistente] = await sequelize.query(`
                    SELECT ID_Persona FROM Personas WHERE PER_Email = :email
                `, {
                    replacements: { email },
                    type: QueryTypes.SELECT,
                    transaction
                });

                if (emailExistente) {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        message: 'El email ya está registrado'
                    });
                }
            }

            // Generar ID_Persona
            const [ultimaPersona] = await sequelize.query(`
                SELECT TOP 1 ID_Persona 
                FROM Personas 
                WHERE ID_Persona LIKE 'PER-%'
                ORDER BY ID_Persona DESC
            `, { type: QueryTypes.SELECT, transaction });

            let nuevoNumeroPersona = 1;
            if (ultimaPersona && ultimaPersona.ID_Persona) {
                const partes = ultimaPersona.ID_Persona.split('-');
                if (partes.length > 1 && !isNaN(partes[1])) {
                    nuevoNumeroPersona = parseInt(partes[1], 10) + 1;
                }
            }

            nuevoIDPersona = `PER-${String(nuevoNumeroPersona).padStart(5, '0')}`;
            nombreCompleto = `${nombre} ${apellido}`;
            telefonoFinal = telefono;
            emailFinal = email;

            // 1. Crear Persona
            await sequelize.query(`
                INSERT INTO Personas (
                    ID_Persona, 
                    PER_DNI, 
                    PER_Nombre, 
                    PER_Apellido, 
                    PER_Telefono, 
                    PER_Email
                ) VALUES (
                    :idPersona, 
                    :dni, 
                    :nombre, 
                    :apellido, 
                    :telefono, 
                    :email
                )
            `, {
                replacements: {
                    idPersona: nuevoIDPersona,
                    dni,
                    nombre,
                    apellido,
                    telefono: telefono || null,
                    email: email || null
                },
                transaction
            });

            // 2. Crear Cliente
            await sequelize.query(`
                INSERT INTO Clientes (
                    ID_Cliente, 
                    ID_Persona, 
                    CLI_Fecha_Registro, 
                    CLI_Puntos_Fidelidad
                ) VALUES (
                    :idCliente, 
                    :idPersona, 
                    GETDATE(), 
                    0
                )
            `, {
                replacements: {
                    idCliente: nuevoIDCliente,
                    idPersona: nuevoIDPersona
                },
                transaction
            });
        }

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            cliente: {
                ID_Cliente: nuevoIDCliente,
                ID_Persona: nuevoIDPersona,
                dni: dni,
                nombre: nombreCompleto,
                PER_Telefono: telefonoFinal,
                PER_Email: emailFinal,
                puntos: 0
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear cliente rápido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar cliente',
            error: error.message
        });
    }
};

// Crear nuevo cliente (método original para el módulo de clientes)
exports.create = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { dni, nombre, apellido, telefono, email, direccion } = req.body;

        // Validaciones
        if (!dni || !nombre || !apellido) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Faltan campos requeridos: dni, nombre, apellido'
            });
        }

        // Verificar si el DNI ya existe
        const [dniExistente] = await sequelize.query(`
            SELECT ID_Persona FROM Personas WHERE PER_DNI = :dni
        `, {
            replacements: { dni },
            type: QueryTypes.SELECT,
            transaction
        });

        if (dniExistente) {
            await transaction.rollback();
            return res.status(400).json({ message: 'El DNI ya está registrado' });
        }

        // Verificar si el email ya existe (si se proporciona)
        if (email) {
            const [emailExistente] = await sequelize.query(`
                SELECT ID_Persona FROM Personas WHERE PER_Email = :email
            `, {
                replacements: { email },
                type: QueryTypes.SELECT,
                transaction
            });

            if (emailExistente) {
                await transaction.rollback();
                return res.status(400).json({ message: 'El email ya está registrado' });
            }
        }

        // Generar IDs
        const personaId = `PER_${Date.now()}`;
        const clienteId = `CLI_${Date.now()}`;

        // 1. Crear Persona
        await sequelize.query(`
            INSERT INTO Personas (
                ID_Persona, 
                PER_DNI, 
                PER_Nombre, 
                PER_Apellido, 
                PER_Telefono, 
                PER_Email, 
                PER_Direccion
            ) VALUES (
                :idPersona, 
                :dni, 
                :nombre, 
                :apellido, 
                :telefono, 
                :email, 
                :direccion
            )
        `, {
            replacements: {
                idPersona: personaId,
                dni,
                nombre,
                apellido,
                telefono: telefono || null,
                email: email || null,
                direccion: direccion || null
            },
            transaction
        });

        // 2. Crear Cliente
        await sequelize.query(`
            INSERT INTO Clientes (
                ID_Cliente, 
                ID_Persona, 
                CLI_Fecha_Registro, 
                CLI_Puntos_Fidelidad
            ) VALUES (
                :idCliente, 
                :idPersona, 
                GETDATE(), 
                0
            )
        `, {
            replacements: {
                idCliente: clienteId,
                idPersona: personaId
            },
            transaction
        });

        await transaction.commit();

        res.status(201).json({
            message: 'Cliente creado exitosamente',
            id: clienteId
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear cliente:', error);
        res.status(500).json({
            message: 'Error al crear cliente',
            error: error.message
        });
    }
};

// Actualizar cliente
exports.update = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { dni, nombre, apellido, telefono, email, direccion } = req.body;

        // Verificar que el cliente existe
        const [cliente] = await sequelize.query(`
            SELECT c.ID_Cliente, c.ID_Persona, p.PER_DNI, p.PER_Email
            FROM Clientes c
            INNER JOIN Personas p ON c.ID_Persona = p.ID_Persona
            WHERE c.ID_Cliente = :id
        `, {
            replacements: { id },
            type: QueryTypes.SELECT,
            transaction
        });

        if (!cliente) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Verificar si el DNI ya existe en otra persona
        if (dni && dni !== cliente.PER_DNI) {
            const [dniExistente] = await sequelize.query(`
                SELECT ID_Persona 
                FROM Personas 
                WHERE PER_DNI = :dni AND ID_Persona != :idPersona
            `, {
                replacements: { dni, idPersona: cliente.ID_Persona },
                type: QueryTypes.SELECT,
                transaction
            });

            if (dniExistente) {
                await transaction.rollback();
                return res.status(400).json({ message: 'El DNI ya está registrado en otro cliente' });
            }
        }

        // Verificar si el email ya existe en otra persona
        if (email && email !== cliente.PER_Email) {
            const [emailExistente] = await sequelize.query(`
                SELECT ID_Persona 
                FROM Personas 
                WHERE PER_Email = :email AND ID_Persona != :idPersona
            `, {
                replacements: { email, idPersona: cliente.ID_Persona },
                type: QueryTypes.SELECT,
                transaction
            });

            if (emailExistente) {
                await transaction.rollback();
                return res.status(400).json({ message: 'El email ya está registrado en otro cliente' });
            }
        }

        // Actualizar Persona
        await sequelize.query(`
            UPDATE Personas SET
                PER_DNI = :dni,
                PER_Nombre = :nombre,
                PER_Apellido = :apellido,
                PER_Telefono = :telefono,
                PER_Email = :email,
                PER_Direccion = :direccion
            WHERE ID_Persona = :idPersona
        `, {
            replacements: {
                dni,
                nombre,
                apellido,
                telefono: telefono || null,
                email: email || null,
                direccion: direccion || null,
                idPersona: cliente.ID_Persona
            },
            transaction
        });

        await transaction.commit();

        res.json({ message: 'Cliente actualizado exitosamente' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({
            message: 'Error al actualizar cliente',
            error: error.message
        });
    }
};

// Eliminar cliente
exports.delete = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;

        // Verificar que el cliente existe y obtener ID_Persona
        const [cliente] = await sequelize.query(`
            SELECT ID_Persona FROM Clientes WHERE ID_Cliente = :id
        `, {
            replacements: { id },
            type: QueryTypes.SELECT,
            transaction
        });

        if (!cliente) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Eliminar cliente primero
        await sequelize.query(`
            DELETE FROM Clientes WHERE ID_Cliente = :id
        `, {
            replacements: { id },
            transaction
        });

        // Eliminar persona asociada
        await sequelize.query(`
            DELETE FROM Personas WHERE ID_Persona = :idPersona
        `, {
            replacements: { idPersona: cliente.ID_Persona },
            transaction
        });

        await transaction.commit();

        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({
            message: 'Error al eliminar cliente',
            error: error.message
        });
    }
};

module.exports = exports;