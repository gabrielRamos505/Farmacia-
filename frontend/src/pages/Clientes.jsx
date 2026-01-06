import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    UserPlus,
    Search,
    Edit2,
    Trash2,
    Mail,
    Phone,
    MapPin,
    Award,
    Calendar,
    Users,
    Loader2,
    AlertCircle,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../utils/permissions';

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);

    const [formData, setFormData] = useState({
        dni: '',
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        direccion: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadClientes();
    }, []);

    const loadClientes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/clientes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClientes(response.data);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.dni.trim()) {
            newErrors.dni = 'El DNI es requerido';
        } else if (!/^\d{8}$/.test(formData.dni)) {
            newErrors.dni = 'El DNI debe tener 8 dígitos';
        }

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (formData.telefono && !/^\d{9}$/.test(formData.telefono)) {
            newErrors.telefono = 'Teléfono debe tener 9 dígitos';
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

            if (editingCliente) {
                // Editar cliente
                await axios.put(
                    `http://localhost:3000/api/clientes/${editingCliente.ID_Cliente}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Cliente actualizado exitosamente');
            } else {
                // Crear nuevo cliente
                await axios.post(
                    'http://localhost:3000/api/clientes',
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Cliente creado exitosamente');
            }

            closeModal();
            loadClientes();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error al guardar cliente');
        }
    };

    const handleDelete = async (clienteId) => {
        if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/clientes/${clienteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Cliente eliminado exitosamente');
            loadClientes();
        } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error(error.response?.data?.message || 'Error al eliminar cliente');
        }
    };

    const openModal = (cliente = null) => {
        if (cliente) {
            setEditingCliente(cliente);
            setFormData({
                dni: cliente.dni || '',
                nombre: cliente.nombre || '',
                apellido: cliente.apellido || '',
                telefono: cliente.telefono || '',
                email: cliente.email || '',
                direccion: cliente.direccion || ''
            });
        } else {
            setEditingCliente(null);
            setFormData({
                dni: '',
                nombre: '',
                apellido: '',
                telefono: '',
                email: '',
                direccion: ''
            });
        }
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCliente(null);
        setFormData({
            dni: '',
            nombre: '',
            apellido: '',
            telefono: '',
            email: '',
            direccion: ''
        });
        setErrors({});
    };

    const filteredClientes = clientes.filter(cliente =>
        cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.dni?.includes(searchTerm) ||
        cliente.telefono?.includes(searchTerm)
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

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
                    <h2 className="text-3xl font-black text-gray-900">Gestión de Clientes</h2>
                    <p className="text-gray-500 font-medium mt-1">Administra la base de datos de tus clientes.</p>
                </div>
                {hasPermission('ADD_CLIENT') && (
                    <button
                        onClick={() => openModal()}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-colors font-bold shadow-lg hover:shadow-xl"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>Registrar Cliente</span>
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, DNI o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 font-medium text-sm">Total Clientes</p>
                            <p className="text-3xl font-black mt-1">{clientes.length}</p>
                        </div>
                        <Users className="w-12 h-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 font-medium text-sm">Clientes Nuevos (Este Mes)</p>
                            <p className="text-3xl font-black mt-1">
                                {clientes.filter(c => {
                                    const fecha = new Date(c.fechaRegistro);
                                    const now = new Date();
                                    return fecha.getMonth() === now.getMonth() &&
                                        fecha.getFullYear() === now.getFullYear();
                                }).length}
                            </p>
                        </div>
                        <Calendar className="w-12 h-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 font-medium text-sm">Puntos Totales</p>
                            <p className="text-3xl font-black mt-1">
                                {clientes.reduce((sum, c) => sum + (c.puntos || 0), 0)}
                            </p>
                        </div>
                        <Award className="w-12 h-12 text-purple-200" />
                    </div>
                </div>
            </div>

            {/* Clientes Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Contacto
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Registro
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Puntos
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClientes.map((cliente, index) => (
                                <motion.tr
                                    key={cliente.ID_Cliente}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 rounded-xl bg-blue-50">
                                                <Users className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {cliente.nombre} {cliente.apellido}
                                                </p>
                                                <p className="text-sm text-gray-500 font-medium">
                                                    DNI: {cliente.dni}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {cliente.telefono && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                    {cliente.telefono}
                                                </div>
                                            )}
                                            {cliente.email && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                    {cliente.email}
                                                </div>
                                            )}
                                            {cliente.direccion && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    {cliente.direccion}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(cliente.fechaRegistro)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-black bg-purple-100 text-purple-700">
                                            <Award className="w-4 h-4 mr-1" />
                                            {cliente.puntos || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            {hasPermission('ADD_CLIENT') && (
                                                <>
                                                    <button
                                                        onClick={() => openModal(cliente)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cliente.ID_Cliente)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredClientes.length === 0 && (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No se encontraron clientes</p>
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
                                        {editingCliente ? 'Editar Cliente' : 'Registrar Cliente'}
                                    </h3>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* DNI */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            DNI *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.dni}
                                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                            className={`w-full px-4 py-3 border ${errors.dni ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            placeholder="12345678"
                                            maxLength="8"
                                        />
                                        {errors.dni && (
                                            <p className="text-red-500 text-xs mt-1 font-medium">{errors.dni}</p>
                                        )}
                                    </div>

                                    {/* Nombre y Apellido */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Nombre *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.nombre ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="Juan"
                                            />
                                            {errors.nombre && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.nombre}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Apellido *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.apellido}
                                                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.apellido ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="Pérez"
                                            />
                                            {errors.apellido && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.apellido}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email y Teléfono */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="juan@email.com"
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.telefono}
                                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.telefono ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="987654321"
                                                maxLength="9"
                                            />
                                            {errors.telefono && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.telefono}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dirección */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Dirección
                                        </label>
                                        <textarea
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Av. Principal 123, Lima"
                                            rows="3"
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
                                            {editingCliente ? 'Actualizar' : 'Registrar'}
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

export default Clientes;