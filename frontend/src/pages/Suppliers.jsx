import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Truck,
    Search,
    Plus,
    Edit2,
    Trash2,
    Phone,
    User,
    Package,
    Loader2,
    X,
    Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../utils/permissions';

const Suppliers = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        contacto: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get('http://localhost:3000/api/proveedores', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProveedores(response.data);
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
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

            if (editingProveedor) {
                await axios.put(
                    `http://localhost:3000/api/proveedores/${editingProveedor.PROV_ID}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Proveedor actualizado exitosamente');
            } else {
                await axios.post(
                    'http://localhost:3000/api/proveedores',
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Proveedor creado exitosamente');
            }

            closeModal();
            loadData();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error al guardar proveedor');
        }
    };

    const handleDelete = async (proveedorId) => {
        if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/proveedores/${proveedorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Proveedor eliminado exitosamente');
            loadData();
        } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error(error.response?.data?.message || 'Error al eliminar proveedor');
        }
    };

    const openModal = (proveedor = null) => {
        if (proveedor) {
            setEditingProveedor(proveedor);
            setFormData({
                nombre: proveedor.PROV_Nombre || '',
                telefono: proveedor.PROV_Telefono || '',
                contacto: proveedor.PROV_Contacto || ''
            });
        } else {
            setEditingProveedor(null);
            setFormData({
                nombre: '',
                telefono: '',
                contacto: ''
            });
        }
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProveedor(null);
        setFormData({
            nombre: '',
            telefono: '',
            contacto: ''
        });
        setErrors({});
    };

    const filteredProveedores = proveedores.filter(proveedor =>
        proveedor.PROV_Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.PROV_Telefono?.includes(searchTerm) ||
        proveedor.PROV_Contacto?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h2 className="text-3xl font-black text-gray-900">Gestión de Proveedores</h2>
                    <p className="text-gray-500 font-medium mt-1">Administra tus proveedores y contactos.</p>
                </div>
                {hasPermission('UPDATE_STOCK') && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-colors font-bold shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Agregar Proveedor</span>
                    </button>
                )}
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 font-medium text-sm">Total Proveedores</p>
                        <p className="text-3xl font-black mt-1">{proveedores.length}</p>
                    </div>
                    <Truck className="w-12 h-12 text-blue-200" />
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                </div>
            </div>

            {/* Proveedores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProveedores.map((proveedor, index) => (
                    <motion.div
                        key={proveedor.PROV_ID}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex items-center space-x-2">
                                {hasPermission('UPDATE_STOCK') && (
                                    <>
                                        <button
                                            onClick={() => openModal(proveedor)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(proveedor.PROV_ID)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-gray-900 mb-4">
                            {proveedor.PROV_Nombre}
                        </h3>

                        <div className="space-y-3">
                            {proveedor.PROV_Telefono && (
                                <div className="flex items-center space-x-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 font-medium">
                                        {proveedor.PROV_Telefono}
                                    </span>
                                </div>
                            )}

                            {proveedor.PROV_Contacto && (
                                <div className="flex items-center space-x-3 text-sm">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 font-medium">
                                        {proveedor.PROV_Contacto}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center space-x-3 text-sm pt-3 border-t border-gray-100">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 font-medium">
                                    {proveedor.PROV_Total_Lotes} lote(s) registrado(s)
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredProveedores.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No se encontraron proveedores</p>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-gray-900">
                                        {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                                    </h3>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Nombre de la Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className={`w-full px-4 py-3 border ${errors.nombre ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            placeholder="Distribuidora Médica S.A."
                                        />
                                        {errors.nombre && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.nombre}</p>
                                        )}
                                    </div>

                                    {/* Teléfono */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Teléfono
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="987654321"
                                        />
                                    </div>

                                    {/* Contacto */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Persona de Contacto
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.contacto}
                                            onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Juan Pérez"
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
                                            {editingProveedor ? 'Actualizar' : 'Crear Proveedor'}
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

export default Suppliers;
