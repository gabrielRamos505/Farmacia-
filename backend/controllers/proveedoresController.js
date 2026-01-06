const Proveedor = require('../models/Proveedor');
const LoteStock = require('../models/LoteStock');
const sequelize = require('../config/database');

// Obtener todos los proveedores
exports.getAll = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll({
            order: [['PROV_Nombre_Empresa', 'ASC']]
        });

        // Contar lotes por proveedor
        const proveedoresConLotes = await Promise.all(
            proveedores.map(async (proveedor) => {
                const totalLotes = await LoteStock.count({
                    where: { ID_Proveedor: proveedor.ID_Proveedor }
                });

                return {
                    PROV_ID: proveedor.ID_Proveedor,
                    PROV_Nombre: proveedor.PROV_Nombre_Empresa,
                    PROV_Telefono: proveedor.PROV_Telefono,
                    PROV_Contacto: proveedor.PROV_Contacto,
                    PROV_Total_Lotes: totalLotes
                };
            })
        );

        res.json(proveedoresConLotes);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ message: 'Error al obtener proveedores' });
    }
};

// Obtener proveedor por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const proveedor = await Proveedor.findByPk(id);

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        // Obtener lotes del proveedor
        const lotes = await LoteStock.findAll({
            where: { ID_Proveedor: id },
            order: [['LST_Fecha_Recepcion', 'DESC']],
            limit: 10
        });

        res.json({
            proveedor,
            lotes
        });
    } catch (error) {
        console.error('Error al obtener proveedor:', error);
        res.status(500).json({ message: 'Error al obtener proveedor' });
    }
};

// Crear nuevo proveedor
exports.create = async (req, res) => {
    try {
        const { nombre, telefono, contacto } = req.body;

        // Validaciones
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({
                message: 'El nombre del proveedor es requerido'
            });
        }

        // Verificar si ya existe un proveedor con el mismo nombre
        const proveedorExistente = await Proveedor.findOne({
            where: { PROV_Nombre_Empresa: nombre }
        });

        if (proveedorExistente) {
            return res.status(400).json({
                message: 'Ya existe un proveedor con ese nombre'
            });
        }

        // Crear proveedor
        const proveedorId = `PROV-${Date.now()}`;
        await Proveedor.create({
            ID_Proveedor: proveedorId,
            PROV_Nombre_Empresa: nombre,
            PROV_Telefono: telefono || null,
            PROV_Contacto: contacto || null
        });

        res.status(201).json({
            message: 'Proveedor creado exitosamente',
            id: proveedorId
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({
            message: 'Error al crear proveedor',
            error: error.message
        });
    }
};

// Actualizar proveedor
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, contacto } = req.body;

        const proveedor = await Proveedor.findByPk(id);

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        // Validaciones
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({
                message: 'El nombre del proveedor es requerido'
            });
        }

        await proveedor.update({
            PROV_Nombre_Empresa: nombre,
            PROV_Telefono: telefono,
            PROV_Contacto: contacto
        });

        res.json({ message: 'Proveedor actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({
            message: 'Error al actualizar proveedor',
            error: error.message
        });
    }
};

// Eliminar proveedor
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const proveedor = await Proveedor.findByPk(id);

        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }

        // Verificar si tiene lotes asociados
        const lotesAsociados = await LoteStock.count({
            where: { ID_Proveedor: id }
        });

        if (lotesAsociados > 0) {
            return res.status(400).json({
                message: `No se puede eliminar. El proveedor tiene ${lotesAsociados} lote(s) asociado(s)`
            });
        }

        await proveedor.destroy();

        res.json({ message: 'Proveedor eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({
            message: 'Error al eliminar proveedor',
            error: error.message
        });
    }
};
