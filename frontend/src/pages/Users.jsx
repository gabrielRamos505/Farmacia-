import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { hasPermission } from '../utils/permissions';
import {
    UserPlus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Eye,
    EyeOff,
    Shield,
    ShoppingBag,
    Package as PackageIcon,
    Stethoscope,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Users = () => {
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').puesto;

    if (!hasPermission('VIEW_USERS')) {
        return <Navigate to="/dashboard" replace />;
    }

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        dni: '',
        nombre: '',
        apellido: '',
        usuario: '',
        password: '',
        puesto: 'Cajero',
        telefono: '',
        email: '',
        estado: 'Activo',
        salario: ''
    });

    const [errors, setErrors] = useState({});

    const PUESTOS = [
        { value: 'Gerente', icon: Shield, color: 'text-purple-600 bg-purple-50' },
        { value: 'Farmacéutico', icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
        { value: 'Cajero', icon: ShoppingBag, color: 'text-green-600 bg-green-50' },
        { value: 'Almacenero', icon: PackageIcon, color: 'text-amber-600 bg-amber-50' },
        { value: 'Auxiliar', icon: UserPlus, color: 'text-gray-600 bg-gray-50' }
    ];

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            toast.error('Error al cargar usuarios');
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

        if (!formData.usuario.trim()) {
            newErrors.usuario = 'El usuario es requerido';
        } else if (formData.usuario.length < 4) {
            newErrors.usuario = 'El usuario debe tener al menos 4 caracteres';
        }

        // Password solo requerido al crear nuevo usuario
        if (!editingUser && !formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
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

            if (editingUser) {
                // Editar usuario existente
                const dataToUpdate = { ...formData };
                // Si no hay password nuevo, no enviarlo
                if (!formData.password || formData.password.trim() === '') {
                    delete dataToUpdate.password;
                }

                await axios.put(
                    `http://localhost:3000/api/users/${editingUser.id}`,
                    dataToUpdate,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Usuario actualizado exitosamente');
            } else {
                // Crear nuevo usuario
                await axios.post(
                    'http://localhost:3000/api/users',
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Usuario creado exitosamente');
            }

            closeModal();
            loadUsers();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Usuario eliminado exitosamente');
            loadUsers();
        } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error(error.response?.data?.message || 'Error al eliminar usuario');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            dni: user.dni || '',
            nombre: user.nombre || '',
            apellido: user.apellido || '',
            usuario: user.usuario || '',
            password: '', // No mostrar password existente
            puesto: user.puesto || 'Cajero',
            telefono: user.telefono || '',
            email: user.email || '',
            estado: user.estado || 'Activo',
            salario: user.salario || ''
        });
        setErrors({});
        setShowPassword(false);
        setShowModal(true);
    };

    const openModal = () => {
        setEditingUser(null);
        setFormData({
            dni: '',
            nombre: '',
            apellido: '',
            usuario: '',
            password: '',
            puesto: 'Cajero',
            telefono: '',
            email: '',
            estado: 'Activo'
        });
        setErrors({});
        setShowPassword(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
            dni: '',
            nombre: '',
            apellido: '',
            usuario: '',
            password: '',
            puesto: 'Cajero',
            telefono: '',
            email: '',
            estado: 'Activo'
        });
        setErrors({});
        setShowPassword(false);
    };

    const [statusFilter, setStatusFilter] = useState('Activos');

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.dni?.includes(searchTerm);

        const matchesStatus =
            statusFilter === 'Todos' ? true :
                statusFilter === 'Activos' ? user.estado === 'Activo' :
                    user.estado !== 'Activo';

        return matchesSearch && matchesStatus;
    });

    const getPuestoIcon = (puesto) => {
        const puestoConfig = PUESTOS.find(p => p.value === puesto);
        return puestoConfig || PUESTOS[2];
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
                    <h2 className="text-3xl font-black text-gray-900">Gestión de Usuarios</h2>
                    <p className="text-gray-500 font-medium mt-1">Controla el acceso y roles del personal.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-colors font-bold shadow-lg hover:shadow-xl"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Registrar Empleado</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, usuario o puesto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                    {['Activos', 'Inactivos', 'Todos'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === status
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Empleado
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Puesto
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Contacto
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Salario
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Estado / Cese
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user, index) => {
                                const puestoConfig = getPuestoIcon(user.puesto);
                                const PuestoIcon = puestoConfig.icon;

                                return (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`p-2 rounded-xl mr-3 ${puestoConfig?.color || 'bg-gray-50 text-gray-600'}`}>
                                                    <PuestoIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-gray-900">
                                                        {user.nombre} {user.apellido}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                                        {user.dni}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-700">{user.usuario}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${puestoConfig?.color}`}>
                                                {user.puesto}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 font-medium">{user.telefono}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">S/ {parseFloat(user.salario || 0).toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${user.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.estado === 'Activo' ? 'bg-green-600' : 'bg-red-600'
                                                        }`} />
                                                    {user.estado}
                                                </span>
                                                {user.estado === 'Inactivo' && user.fechaBaja && (
                                                    <span className="text-[10px] text-gray-400 font-medium mt-1">
                                                        Baja: {new Date(user.fechaBaja).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
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
                                        {editingUser ? 'Editar Usuario' : 'Registrar Empleado'}
                                    </h3>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
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

                                    {/* Salario y Puesto */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Salario Mensual (S/) *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.salario}
                                                onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Puesto *
                                            </label>
                                            <select
                                                value={formData.puesto}
                                                onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            >
                                                {PUESTOS.map((p) => (
                                                    <option key={p.value} value={p.value}>
                                                        {p.value}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Usuario y Contraseña */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Usuario *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.usuario}
                                                onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                                                className={`w-full px-4 py-3 border ${errors.usuario ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="juanperez"
                                            />
                                            {errors.usuario && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.usuario}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Contraseña {!editingUser && '*'}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                    placeholder={editingUser ? 'Dejar vacío para no cambiar' : '••••••'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {editingUser && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Deja este campo vacío si no deseas cambiar la contraseña
                                                </p>
                                            )}
                                            {errors.password && (
                                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Estado */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Estado *
                                        </label>
                                        <select
                                            value={formData.estado}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        >
                                            <option value="Activo">Activo</option>
                                            <option value="Inactivo">Inactivo</option>
                                            <option value="Suspendido">Suspendido</option>
                                            <option value="Vacaciones">Vacaciones</option>
                                        </select>
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
                                                placeholder="juan@farmacia.com"
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
                                            {editingUser ? 'Actualizar' : 'Registrar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-black text-gray-900 mb-4">Resumen de Personal (Activos)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {PUESTOS.map((puesto) => {
                        const count = users.filter(u => u.puesto === puesto.value && u.estado === 'Activo').length;
                        const IconComponent = puesto.icon;
                        return (
                            <div key={puesto.value} className="text-center">
                                <div className={`inline-flex p-3 rounded-2xl ${puesto.color} mb-2`}>
                                    <IconComponent className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-gray-500">{puesto.value}s</p>
                                <p className="text-2xl font-black text-gray-900">{count}</p>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">Total Personal Activo</span>
                    <span className="text-2xl font-black text-gray-900">{users.filter(u => u.estado === 'Activo').length}</span>
                </div>
            </div>
        </div>
    );
};

export default Users;
