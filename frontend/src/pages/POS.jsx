import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    DollarSign,
    User,
    Barcode,
    Loader2,
    CreditCard,
    Banknote,
    Receipt,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../utils/permissions';

const POS = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [montoPagado, setMontoPagado] = useState('');
    const [descuento, setDescuento] = useState(0);
    const [searchTermDNI, setSearchTermDNI] = useState('');
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
    const [nuevoCliente, setNuevoCliente] = useState({
        dni: '',
        nombre: '',
        apellido: '',
        telefono: '',
        email: ''
    });
    const searchInputRef = useRef(null);

    useEffect(() => {
        loadClientes();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                searchProducts();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const loadClientes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/clientes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClientes(response.data);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        }
    };

    const searchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:3000/api/pos/search?search=${searchTerm}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error al buscar productos:', error);
        }
    };

    const addToCart = (producto) => {
        const existingItem = cart.find(item => item.ID_Producto === producto.ID_Producto);

        if (existingItem) {
            if (existingItem.cantidad >= producto.Stock) {
                toast.error('Stock insuficiente');
                return;
            }
            setCart(cart.map(item =>
                item.ID_Producto === producto.ID_Producto
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            if (producto.Stock <= 0) {
                toast.error('Producto sin stock');
                return;
            }
            setCart([...cart, { ...producto, cantidad: 1 }]);
        }

        setSearchTerm('');
        setSearchResults([]);
        searchInputRef.current?.focus();
        toast.success('Producto agregado');
    };

    const updateQuantity = (productId, newQuantity) => {
        const producto = cart.find(item => item.ID_Producto === productId);

        if (newQuantity > producto.Stock) {
            toast.error('Stock insuficiente');
            return;
        }

        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(cart.map(item =>
            item.ID_Producto === productId
                ? { ...item, cantidad: newQuantity }
                : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.ID_Producto !== productId));
        toast.success('Producto eliminado');
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.Precio * item.cantidad), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal - descuento;
    };

    const handleSearchDNI = async () => {
        if (!searchTermDNI || searchTermDNI.length < 8) {
            toast.error('Ingrese un DNI válido');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/api/clientes/buscar-dni/${searchTermDNI}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const cliente = response.data.cliente;
                // Si el cliente no está en la lista actual, agregarlo temporalmente para el select
                if (!clientes.find(c => c.ID_Cliente === cliente.ID_Cliente)) {
                    setClientes([...clientes, {
                        ID_Cliente: cliente.ID_Cliente,
                        nombre: cliente.PER_Nombre,
                        apellido: cliente.PER_Apellido,
                        dni: cliente.dni
                    }]);
                }
                setClienteSeleccionado(cliente.ID_Cliente);
                toast.success(`Cliente encontrado: ${cliente.nombre}`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setNuevoCliente(prev => ({ ...prev, dni: searchTermDNI }));
                setMostrarModalCliente(true);
            } else {
                toast.error('Error al buscar cliente');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCliente = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:3000/api/clientes/crear-rapido', nuevoCliente, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const cliente = response.data.cliente;
                setClientes([...clientes, {
                    ID_Cliente: cliente.ID_Cliente,
                    nombre: nuevoCliente.nombre,
                    apellido: nuevoCliente.apellido,
                    dni: cliente.dni
                }]);
                setClienteSeleccionado(cliente.ID_Cliente);
                setMostrarModalCliente(false);
                toast.success('Cliente registrado y seleccionado');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al registrar cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSale = async () => {
        if (cart.length === 0) {
            toast.error('Debe agregar al menos un producto');
            return;
        }

        const total = calculateTotal();

        if (metodoPago === 'Efectivo') {
            const pago = parseFloat(montoPagado);
            if (!pago || pago < total) {
                toast.error('El monto pagado es insuficiente');
                return;
            }
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const ventaData = {
                clienteId: clienteSeleccionado,
                productos: cart.map(item => ({
                    idLote: item.ID_Lote_Stock,
                    cantidad: item.cantidad,
                    precioUnitario: item.Precio
                })),
                subtotal: calculateSubtotal(),
                descuento: descuento,
                total: total,
                metodoPago: metodoPago,
                montoPagado: parseFloat(montoPagado) || total,
                cambio: metodoPago === 'Efectivo' ? parseFloat(montoPagado) - total : 0
            };

            const response = await axios.post(
                'http://localhost:3000/api/pos/sale',
                ventaData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('¡Venta registrada exitosamente!');

            // Resetear formulario
            setCart([]);
            setClienteSeleccionado(null);
            setDescuento(0);
            setMontoPagado('');
            setSearchTerm('');
            searchInputRef.current?.focus();
        } catch (error) {
            console.error('Error al registrar venta:', error);
            toast.error(error.response?.data?.message || 'Error al registrar venta');
        } finally {
            setLoading(false);
        }
    };

    const cambio = metodoPago === 'Efectivo' && montoPagado
        ? Math.max(0, parseFloat(montoPagado) - calculateTotal())
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-gray-900">Punto de Venta</h2>
                <p className="text-gray-500 font-medium mt-1">Sistema de ventas rápidas.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Izquierdo - Búsqueda y Productos */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Búsqueda */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Buscar por nombre o código de barras..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-lg"
                                autoFocus
                            />
                        </div>

                        {/* Resultados de búsqueda */}
                        {searchResults.length > 0 && (
                            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                                {searchResults.map((producto) => (
                                    <motion.button
                                        key={producto.ID_Producto}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => addToCart(producto)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left"
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{producto.Nombre}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-500 flex items-center">
                                                    <Barcode className="w-3 h-3 mr-1" />
                                                    {producto.Codigo_Barras}
                                                </span>
                                                <span className={`text-xs font-black ${producto.Stock > 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    Stock: {producto.Stock}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-blue-600">
                                                S/ {producto.Precio.toFixed(2)}
                                            </p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Carrito */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900">Carrito de Compras</h3>
                                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-xl">
                                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                                    <span className="font-black text-blue-600">{cart.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 max-h-96 overflow-y-auto space-y-3">
                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">Carrito vacío</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <motion.div
                                        key={item.ID_Producto}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{item.Nombre}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                S/ {item.Precio.toFixed(2)} c/u
                                            </p>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => updateQuantity(item.ID_Producto, item.cantidad - 1)}
                                                className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-12 text-center font-bold text-lg">
                                                {item.cantidad}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.ID_Producto, item.cantidad + 1)}
                                                className="p-2 bg-white hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-black text-lg text-gray-900">
                                                S/ {(item.Precio * item.cantidad).toFixed(2)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.ID_Producto)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel Derecho - Resumen y Pago */}
                <div className="space-y-4">
                    {/* Cliente */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            Buscar Cliente por DNI
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ingrese DNI..."
                                value={searchTermDNI}
                                onChange={(e) => setSearchTermDNI(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSearchDNI}
                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                        {hasPermission('ADD_CLIENT') && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setMostrarModalCliente(true)}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-bold text-sm shadow-md"
                                >
                                    Registrar Cliente
                                </button>
                            </div>
                        )}

                        <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Cliente Seleccionado
                            </label>
                            <select
                                value={clienteSeleccionado || ''}
                                onChange={(e) => setClienteSeleccionado(e.target.value || null)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            >
                                <option value="">-- Seleccionar de la lista --</option>
                                <option value="">Cliente General</option>
                                {clientes.map((cliente) => (
                                    <option
                                        key={cliente.ID_Cliente || cliente.ID_Persona}
                                        value={cliente.ID_Cliente}
                                    >
                                        {cliente.nombre} {cliente.apellido} {cliente.dni ? `(${cliente.dni})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Descuento */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            Descuento (S/)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={descuento}
                            onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Método de Pago */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            Método de Pago
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setMetodoPago('Efectivo')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${metodoPago === 'Efectivo'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Banknote className="w-6 h-6 mb-2" />
                                <span className="text-sm font-bold">Efectivo</span>
                            </button>
                            <button
                                onClick={() => setMetodoPago('Tarjeta')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${metodoPago === 'Tarjeta'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <CreditCard className="w-6 h-6 mb-2" />
                                <span className="text-sm font-bold">Tarjeta</span>
                            </button>
                        </div>

                        {metodoPago === 'Efectivo' && (
                            <div className="mt-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Monto Recibido
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={montoPagado}
                                    onChange={(e) => setMontoPagado(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    placeholder="0.00"
                                />
                                {cambio > 0 && (
                                    <p className="mt-2 text-sm font-bold text-green-600">
                                        Cambio: S/ {cambio.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resumen */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="font-medium">Subtotal:</span>
                                <span className="font-bold">S/ {calculateSubtotal().toFixed(2)}</span>
                            </div>
                            {descuento > 0 && (
                                <div className="flex justify-between">
                                    <span className="font-medium">Descuento:</span>
                                    <span className="font-bold">- S/ {descuento.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-blue-400 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">TOTAL:</span>
                                    <span className="text-3xl font-black">
                                        S/ {calculateTotal().toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCompleteSale}
                            disabled={cart.length === 0 || loading}
                            className="w-full mt-6 bg-white text-blue-600 px-6 py-4 rounded-xl hover:bg-blue-50 transition-colors font-black text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <Receipt className="w-5 h-5" />
                                    <span>Completar Venta</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* Modal Registro Cliente Rápido */}
            <AnimatePresence>
                {mostrarModalCliente && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-gray-900">Registrar Cliente</h3>
                                <button onClick={() => setMostrarModalCliente(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCliente} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">DNI</label>
                                    <input
                                        type="text"
                                        required
                                        value={nuevoCliente.dni}
                                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, dni: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            required
                                            value={nuevoCliente.nombre}
                                            onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Apellido</label>
                                        <input
                                            type="text"
                                            required
                                            value={nuevoCliente.apellido}
                                            onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        value={nuevoCliente.telefono}
                                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={nuevoCliente.email}
                                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-4"
                                >
                                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <User className="w-5 h-5" />}
                                    Guardar y Seleccionar
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default POS;
