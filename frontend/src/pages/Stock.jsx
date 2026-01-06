import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Package,
    Search,
    Plus,
    Edit2,
    Calendar,
    AlertTriangle,
    TrendingDown,
    Loader2,
    X,
    MapPin,
    Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../utils/permissions';

const Stock = () => {
    const [lotes, setLotes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        productoId: '',
        proveedorId: '',
        numeroLote: '',
        fechaVencimiento: '',
        cantidad: '',
        costoUnitario: '',
        ubicacion: 'Almacén General'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const [lotesRes, productosRes, proveedoresRes] = await Promise.all([
                axios.get('http://localhost:3000/api/lotes', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:3000/api/productos', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:3000/api/proveedores', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setLotes(lotesRes.data);
            setProductos(productosRes.data);
            setProveedores(proveedoresRes.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar lotes');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.productoId) {
            newErrors.productoId = 'El producto es requerido';
        }

        if (!formData.cantidad || formData.cantidad <= 0) {
            newErrors.cantidad = 'La cantidad debe ser mayor a 0';
        }

        if (!formData.costoUnitario || formData.costoUnitario <= 0) {
            newErrors.costoUnitario = 'El costo debe ser mayor a 0';
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

            await axios.post(
                'http://localhost:3000/api/lotes',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Lote registrado exitosamente');
            closeModal();
            loadData();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error al registrar lote');
        }
    };

    const openModal = () => {
        setFormData({
            productoId: '',
            proveedorId: '',
            numeroLote: '',
            fechaVencimiento: '',
            cantidad: '',
            costoUnitario: '',
            ubicacion: 'Almacén General'
        });
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({
            productoId: '',
            proveedorId: '',
            numeroLote: '',
            fechaVencimiento: '',
            cantidad: '',
            costoUnitario: '',
            ubicacion: 'Almacén General'
        });
        setErrors({});
    };

    const filteredLotes = lotes.filter(lote =>
        lote.Producto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lote.Numero_Lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lote.Proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calcular días hasta vencimiento
    const getDiasVencimiento = (fecha) => {
        if (!fecha) return null;
        const hoy = new Date();
        const vencimiento = new Date(fecha);
        const diffTime = vencimiento - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Estadísticas
    const totalLotes = lotes.length;
    const lotesActivos = lotes.filter(l => l.Estado === 'Activo').length;
    const lotesProximosVencer = lotes.filter(l => {
        const dias = getDiasVencimiento(l.Fecha_Vencimiento);
        return dias !== null && dias <= 30 && dias > 0;
    }).length;
    const lotesVencidos = lotes.filter(l => {
        const dias = getDiasVencimiento(l.Fecha_Vencimiento);
        return dias !== null && dias < 0;
    }).length;

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
                    <h2 className="text-3xl font-black text-gray-900">Gestión de Lotes</h2>
                    <p className="text-gray-500 font-medium mt-1">Administra el stock y lotes de productos.</p>
                </div>
                {hasPermission('UPDATE_STOCK') && (
                    <button
                        onClick={openModal}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-colors font-bold shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Registrar Lote</span>
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 font-medium text-sm">Total Lotes</p>
                            <p className="text-3xl font-black mt-1">{totalLotes}</p>
                        </div>
                        <Package className="w-12 h-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 font-medium text-sm">Lotes Activos</p>
                            <p className="text-3xl font-black mt-1">{lotesActivos}</p>
                        </div>
                        <Package className="w-12 h-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 font-medium text-sm">Por Vencer (30d)</p>
                            <p className="text-3xl font-black mt-1">{lotesProximosVencer}</p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-amber-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 font-medium text-sm">Vencidos</p>
                            <p className="text-3xl font-black mt-1">{lotesVencidos}</p>
                        </div>
                        <TrendingDown className="w-12 h-12 text-red-200" />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por producto, número de lote o proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                </div>
            </div>

            {/* Lotes Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    N° Lote
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Proveedor
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Vencimiento
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Ubicación
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLotes.map((lote, index) => {
                                const diasVencimiento = getDiasVencimiento(lote.Fecha_Vencimiento);
                                const statusVencimiento =
                                    diasVencimiento === null ? 'sin-fecha' :
                                        diasVencimiento < 0 ? 'vencido' :
                                            diasVencimiento <= 30 ? 'proximo' : 'ok';

                                return (
                                    <motion.tr
                                        key={lote.ID_Lote}
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
                                                <p className="font-bold text-gray-900">{lote.Producto}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-700">{lote.Numero_Lote || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <Truck className="w-4 h-4 text-gray-400" />
                                                <p className="text-sm text-gray-600">{lote.Proveedor || 'Sin proveedor'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">
                                                {lote.Cantidad_Actual} / {lote.Cantidad_Inicial}
                                            </p>
                                            <p className="text-xs text-gray-500">unidades</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lote.Fecha_Vencimiento ? (
                                                <div>
                                                    <p className="font-medium text-gray-700">
                                                        {new Date(lote.Fecha_Vencimiento).toLocaleDateString('es-PE')}
                                                    </p>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-black mt-1 ${statusVencimiento === 'vencido'
                                                        ? 'bg-red-100 text-red-700'
                                                        : statusVencimiento === 'proximo'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {statusVencimiento === 'vencido'
                                                            ? `Vencido hace ${Math.abs(diasVencimiento)} días`
                                                            : statusVencimiento === 'proximo'
                                                                ? `${diasVencimiento} días`
                                                                : `${diasVencimiento} días`}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Sin fecha</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <p className="text-sm text-gray-600">{lote.Ubicacion || 'Sin ubicación'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${lote.Estado === 'Activo'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {lote.Estado}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredLotes.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No se encontraron lotes</p>
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
                                    <h3 className="text-2xl font-black text-gray-900">Registrar Nuevo Lote</h3>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Producto y Proveedor */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Producto *
                                            </label>
                                            <select
                                                value={formData.productoId}
                                                onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.productoId ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium`}
                                            >
                                                <option value="">Seleccionar producto</option>
                                                {productos.map(prod => (
                                                    <option key={prod.PROD_ID} value={prod.PROD_ID}>
                                                        {prod.PROD_Nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.productoId && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.productoId}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Proveedor
                                            </label>
                                            <select
                                                value={formData.proveedorId}
                                                onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            >
                                                <option value="">Sin proveedor</option>
                                                {proveedores.map(prov => (
                                                    <option key={prov.PROV_ID} value={prov.PROV_ID}>
                                                        {prov.PROV_Nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Número de Lote y Fecha de Vencimiento */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Número de Lote
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.numeroLote}
                                                onChange={(e) => setFormData({ ...formData, numeroLote: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="LOTE-001"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Fecha de Vencimiento
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.fechaVencimiento}
                                                onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Cantidad y Costo */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Cantidad *
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.cantidad}
                                                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.cantidad ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="100"
                                            />
                                            {errors.cantidad && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.cantidad}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Costo Unitario (S/) *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.costoUnitario}
                                                onChange={(e) => setFormData({ ...formData, costoUnitario: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.costoUnitario ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="10.50"
                                            />
                                            {errors.costoUnitario && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.costoUnitario}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ubicación */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Ubicación
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ubicacion}
                                            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Almacén General"
                                        />
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
                                            Registrar Lote
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

export default Stock;
