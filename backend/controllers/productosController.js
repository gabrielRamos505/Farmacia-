const ProductoComercial = require('../models/ProductoComercial');
const PrincipioActivo = require('../models/PrincipioActivo');
const LoteStock = require('../models/LoteStock');
const sequelize = require('../config/database');

// Obtener todos los productos con stock
exports.getAll = async (req, res) => {
    try {
        const productos = await ProductoComercial.findAll({
            include: [
                {
                    model: PrincipioActivo,
                    attributes: ['PAC_Nombre_Base']
                }
            ],
            order: [['PCO_Nombre_Comercial', 'ASC']]
        });

        // Calcular stock total de cada producto
        const productosConStock = await Promise.all(
            productos.map(async (producto) => {
                const stockTotal = await LoteStock.sum('LST_Cantidad_Actual', {
                    where: {
                        ID_Producto: producto.ID_Producto,
                        LST_Estado: 'Disponible'
                    }
                });

                return {
                    PROD_ID: producto.ID_Producto,
                    PROD_Codigo_Barras: producto.PCO_Codigo_Barras,
                    PROD_Nombre: producto.PCO_Nombre_Comercial,
                    PROD_Laboratorio: producto.PCO_Laboratorio,
                    PROD_Categoria: producto.PrincipioActivo?.PAC_Nombre_Base || 'Sin categoría',
                    PROD_Precio: producto.PCO_Precio_Venta,
                    PROD_Stock: stockTotal || 0,
                    PROD_Stock_Minimo: producto.PCO_Stock_Minimo,
                    PROD_Requiere_Receta: producto.PCO_Requiere_Receta,
                    PROD_Estado: producto.PCO_Estado,
                    PROD_Unidad: producto.PCO_Presentacion || 'Unidad'
                };
            })
        );

        res.json(productosConStock);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};

// Obtener producto por ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await ProductoComercial.findByPk(id, {
            include: [
                {
                    model: PrincipioActivo,
                    attributes: ['ID_Principio_Activo', 'PAC_Nombre_Base']
                }
            ]
        });

        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Obtener lotes del producto
        const lotes = await LoteStock.findAll({
            where: {
                ID_Producto: id,
                LST_Estado: 'Activo'
            }
        });

        res.json({
            producto,
            lotes
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ message: 'Error al obtener producto' });
    }
};

// Crear nuevo producto
exports.create = async (req, res) => {
    try {
        const {
            codigoBarras,
            nombre,
            laboratorio,
            categoria,
            precio,
            stockMinimo,
            requiereReceta,
            unidadMedida
        } = req.body;

        // Validaciones
        if (!nombre || !precio || !categoria) {
            return res.status(400).json({
                message: 'Faltan campos requeridos: nombre, precio, categoría'
            });
        }

        // Verificar si el código de barras ya existe
        if (codigoBarras) {
            const codigoExistente = await ProductoComercial.findOne({
                where: { PCO_Codigo_Barras: codigoBarras }
            });

            if (codigoExistente) {
                return res.status(400).json({
                    message: 'El código de barras ya existe'
                });
            }
        }

        // Crear producto
        const productoId = `PROD-${Date.now()}`;
        await ProductoComercial.create({
            ID_Producto: productoId,
            PCO_Codigo_Barras: codigoBarras || null,
            ID_Principio_Activo: categoria,
            PCO_Nombre_Comercial: nombre,
            PCO_Laboratorio: laboratorio || 'Lab. Generico',
            PCO_Presentacion: unidadMedida || 'Unidad',
            PCO_Precio_Venta: precio,
            PCO_Requiere_Receta: requiereReceta || false,
            PCO_Stock_Minimo: stockMinimo || 10,
            PCO_Estado: 'Activo'
        });

        res.status(201).json({
            message: 'Producto creado exitosamente',
            id: productoId
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({
            message: 'Error al crear producto',
            error: error.message
        });
    }
};

// Actualizar producto
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            codigoBarras,
            nombre,
            laboratorio,
            categoria,
            precio,
            stockMinimo,
            requiereReceta,
            unidadMedida,
            estado
        } = req.body;

        const producto = await ProductoComercial.findByPk(id);

        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        await producto.update({
            PCO_Codigo_Barras: codigoBarras,
            PCO_Nombre_Comercial: nombre,
            PCO_Laboratorio: laboratorio,
            ID_Principio_Activo: categoria,
            PCO_Precio_Venta: precio,
            PCO_Stock_Minimo: stockMinimo,
            PCO_Requiere_Receta: requiereReceta,
            PCO_Presentacion: unidadMedida,
            PCO_Estado: estado
        });

        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({
            message: 'Error al actualizar producto',
            error: error.message
        });
    }
};

// Eliminar producto
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await ProductoComercial.findByPk(id);

        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // En lugar de eliminar, cambiar estado a Descontinuado
        await producto.update({ PCO_Estado: 'Descontinuado' });

        res.json({ message: 'Producto desactivado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            message: 'Error al eliminar producto',
            error: error.message
        });
    }
};

// Obtener todas las categorías (Principios Activos)
exports.getCategorias = async (req, res) => {
    try {
        const categorias = await PrincipioActivo.findAll({
            order: [['PAC_Nombre_Base', 'ASC']]
        });

        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ message: 'Error al obtener categorías' });
    }
};
