import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Package,
    Search,
    Plus,
    Edit2,
    Trash2,
    AlertCircle,
    TrendingDown,
    TrendingUp,
    DollarSign,
    Loader2,
    X,
    Barcode,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../utils/permissions';

const Inventory = () => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProducto, setEditingProducto] = useState(null);
    const [filterCategoria, setFilterCategoria] = useState('all');
    const [filterStock, setFilterStock] = useState('all');

    const [formData, setFormData] = useState({
        codigoBarras: '',
        nombre: '',
        laboratorio: '',
        categoria: '',
        precio: '',
        stockMinimo: '10',
        requiereReceta: false,
        unidadMedida: 'Unidad',
        estado: 'Activo'
    });

    const [errors, setErrors] = useState({});

    const UNIDADES = ['Unidad', 'Caja', 'Frasco', 'Blister', 'Sobre'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const [productosRes, categoriasRes] = await Promise.all([
                axios.get('http://localhost:3000/api/productos', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:3000/api/productos/categorias', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setProductos(productosRes.data);
            setCategorias(categoriasRes.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.precio || formData.precio <= 0) {
            newErrors.precio = 'El precio debe ser mayor a 0';
        }

        if (!formData.categoria) {
            newErrors.categoria = 'La categoría es requerida';
        }

        if (formData.stockMinimo < 0) {
            newErrors.stockMinimo = 'El stock mínimo no puede ser negativo';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            if (editingProducto) {
                await axios.put(
                    `http://localhost:3000/api/productos/${editingProducto.PROD_ID}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Producto actualizado exitosamente');
            } else {
                await axios.post(
                    'http://localhost:3000/api/productos',
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Producto creado exitosamente');
            }

            closeModal();
            loadData();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error al guardar producto');
        }
    };

    const handleDelete = async (productoId) => {
        if (!window.confirm('¿Estás seguro de desactivar este producto?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/productos/${productoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Producto desactivado exitosamente');
            loadData();
        } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error(error.response?.data?.message || 'Error al eliminar producto');
        }
    };

    const openModal = (producto = null) => {
        if (producto) {
            setEditingProducto(producto);
            setFormData({
                codigoBarras: producto.PROD_Codigo_Barras || '',
                nombre: producto.PROD_Nombre || '',
                laboratorio: producto.PROD_Laboratorio || '',
                categoria: producto.PROD_Categoria || '',
                precio: producto.PROD_Precio || '',
                stockMinimo: producto.PROD_Stock_Minimo || '10',
                requiereReceta: producto.PROD_Requiere_Receta || false,
                unidadMedida: producto.PROD_Unidad || 'Unidad',
                estado: producto.PROD_Estado || 'Activo'
            });
        } else {
            setEditingProducto(null);
            setFormData({
                codigoBarras: '',
                nombre: '',
                laboratorio: '',
                categoria: '',
                precio: '',
                stockMinimo: '10',
                requiereReceta: false,
                unidadMedida: 'Unidad',
                estado: 'Activo'
            });
        }
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProducto(null);
        setFormData({
            codigoBarras: '',
            nombre: '',
            laboratorio: '',
            categoria: '',
            precio: '',
            stockMinimo: '10',
            requiereReceta: false,
            unidadMedida: 'Unidad',
            estado: 'Activo'
        });
        setErrors({});
    };

    const filteredProductos = productos.filter(producto => {
        const matchesSearch =
            producto.PROD_Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.PROD_Codigo_Barras?.includes(searchTerm) ||
            producto.PROD_Laboratorio?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategoria =
            filterCategoria === 'all' || producto.PROD_Categoria === filterCategoria;

        const matchesStock =
            filterStock === 'all' ||
            (filterStock === 'bajo' && producto.PROD_Stock <= producto.PROD_Stock_Minimo) ||
            (filterStock === 'sin' && producto.PROD_Stock === 0);

        return matchesSearch && matchesCategoria && matchesStock;
    });

    // Estadísticas
    const totalProductos = productos.length;
    const productosBajoStock = productos.filter(p => p.PROD_Stock <= p.PROD_Stock_Minimo && p.PROD_Stock > 0).length;
    const productosSinStock = productos.filter(p => p.PROD_Stock === 0).length;
    const valorTotalInventario = productos.reduce((sum, p) => sum + (p.PROD_Precio * p.PROD_Stock), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Gestión de Inventario</h2>
                    <p className="text-gray-500 font-medium mt-1">Administra productos y stock de la farmacia.</p>
                </div>
                {hasPermission('ADD_PRODUCT') && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-colors font-bold shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Agregar Producto</span>
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 font-medium text-sm">Total Productos</p>
                            <p className="text-3xl font-black mt-1">{totalProductos}</p>
                        </div>
                        <Package className="w-12 h-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 font-medium text-sm">Stock Bajo</p>
                            <p className="text-3xl font-black mt-1">{productosBajoStock}</p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-amber-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 font-medium text-sm">Sin Stock</p>
                            <p className="text-3xl font-black mt-1">{productosSinStock}</p>
                        </div>
                        <TrendingDown className="w-12 h-12 text-red-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 font-medium text-sm">Valor Inventario</p>
                            <p className="text-3xl font-black mt-1">S/ {valorTotalInventario.toFixed(2)}</p>
                        </div>
                        <DollarSign className="w-12 h-12 text-green-200" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código o laboratorio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                    </div>

                    {/* Filter Categoria */}
                    <select
                        value={filterCategoria}
                        onChange={(e) => setFilterCategoria(e.target.value)}
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                        <option value="all">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat.ID_Principio_Activo} value={cat.PAC_Nombre_Base}>
                                {cat.PAC_Nombre_Base}
                            </option>
                        ))}
                    </select>

                    {/* Filter Stock */}
                    <select
                        value={filterStock}
                        onChange={(e) => setFilterStock(e.target.value)}
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                        <option value="all">Todo el stock</option>
                        <option value="bajo">Stock bajo</option>
                        <option value="sin">Sin stock</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Precio
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProductos.map((producto, index) => {
                                const stockStatus =
                                    producto.PROD_Stock === 0 ? 'sin' :
                                        producto.PROD_Stock <= producto.PROD_Stock_Minimo ? 'bajo' : 'ok';

                                return (
                                    <motion.tr
                                        key={producto.PROD_ID}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 rounded-xl bg-blue-50">
                                                    <Package className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {producto.PROD_Nombre}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {producto.PROD_Codigo_Barras && (
                                                            <span className="text-xs text-gray-500 font-medium flex items-center">
                                                                <Barcode className="w-3 h-3 mr-1" />
                                                                {producto.PROD_Codigo_Barras}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-500">
                                                            {producto.PROD_Laboratorio}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-700">
                                                {producto.PROD_Categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">
                                                S/ {parseFloat(producto.PROD_Precio).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                por {producto.PROD_Unidad}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${stockStatus === 'sin'
                                                    ? 'bg-red-100 text-red-700'
                                                    : stockStatus === 'bajo'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {producto.PROD_Stock} {producto.PROD_Unidad}
                                                </span>
                                                {stockStatus !== 'ok' && (
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Mín: {producto.PROD_Stock_Minimo}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${producto.PROD_Estado === 'Activo'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {producto.PROD_Estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end space-x-2">
                                                {hasPermission('EDIT_PRODUCT') && (
                                                    <button
                                                        onClick={() => openModal(producto)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {hasPermission('DELETE_PRODUCT') && (
                                                    <button
                                                        onClick={() => handleDelete(producto.PROD_ID)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredProductos.length === 0 && (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No se encontraron productos</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-gray-900">
                                        {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                                    </h3>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Nombre y Código de Barras */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Nombre del Producto *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.nombre ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="Paracetamol 500mg"
                                            />
                                            {errors.nombre && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.nombre}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Código de Barras
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.codigoBarras}
                                                onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="7501234567890"
                                            />
                                        </div>
                                    </div>

                                    {/* Laboratorio y Categoría */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Laboratorio
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.laboratorio}
                                                onChange={(e) => setFormData({ ...formData, laboratorio: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Lab. Bayer"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Categoría *
                                            </label>
                                            <select
                                                value={formData.categoria}
                                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.categoria ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium`}
                                            >
                                                <option value="">Seleccionar categoría</option>
                                                {categorias.map(cat => (
                                                    <option key={cat.ID_Principio_Activo} value={cat.ID_Principio_Activo}>
                                                        {cat.PAC_Nombre_Base}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.categoria && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.categoria}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Precio, Stock Mínimo y Unidad */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Precio (S/) *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.precio}
                                                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.precio ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="15.50"
                                            />
                                            {errors.precio && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.precio}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Stock Mínimo
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.stockMinimo}
                                                onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Unidad de Medida
                                            </label>
                                            <select
                                                value={formData.unidadMedida}
                                                onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            >
                                                {UNIDADES.map(unidad => (
                                                    <option key={unidad} value={unidad}>{unidad}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Requiere Receta y Estado */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                                            <input
                                                type="checkbox"
                                                checked={formData.requiereReceta}
                                                onChange={(e) => setFormData({ ...formData, requiereReceta: e.target.checked })}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <label className="text-sm font-bold text-gray-700">
                                                Requiere Receta Médica
                                            </label>
                                        </div>

                                        {editingProducto && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                                    Estado
                                                </label>
                                                <select
                                                    value={formData.estado}
                                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                >
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex items-center justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg"
                                        >
                                            {editingProducto ? 'Actualizar' : 'Crear Producto'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Inventory;
