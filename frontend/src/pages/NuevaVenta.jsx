import React, { useState, useEffect } from 'react';
import { ventasService } from '../services/api';
import '../components/NuevaVenta.css';

const NuevaVenta = ({ onClose, onVentaCreada }) => {
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [searchProducto, setSearchProducto] = useState('');
    const [searchCliente, setSearchCliente] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrarProductos, setMostrarProductos] = useState(false);
    const [mostrarClientes, setMostrarClientes] = useState(false);

    // Estados para formulario de registro de cliente
    const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
    const [nuevoCliente, setNuevoCliente] = useState({
        dni: '',
        nombre: '',
        apellido: '',
        telefono: '',
        email: ''
    });

    // Buscar productos
    const buscarProductos = async (search) => {
        if (search.length < 1) {
            setProductos([]);
            setMostrarProductos(false);
            return;
        }

        try {
            const response = await ventasService.searchProductos(search);
            setProductos(response.data);
            setMostrarProductos(true);
        } catch (error) {
            console.error('Error al buscar productos:', error);
            setProductos([]);
        }
    };

    // Buscar clientes
    const buscarClientes = async (search) => {
        if (search.length < 2) {
            setClientes([]);
            setMostrarClientes(false);
            return;
        }

        try {
            const response = await ventasService.searchClientes(search);
            setClientes(response.data);
            setMostrarClientes(true);
        } catch (error) {
            console.error('Error al buscar clientes:', error);
            setClientes([]);
        }
    };

    // ➕ NUEVO: Buscar cliente por DNI exacto
    const buscarClientePorDNI = async (dni) => {
        if (!dni || dni.length < 8) {
            alert('Ingrese un DNI válido (mínimo 8 dígitos)');
            return;
        }

        setLoading(true);

        try {
            const response = await ventasService.buscarClientePorDNI(dni);

            if (response.data.success) {
                seleccionarCliente(response.data.cliente);
                alert(`✅ Cliente encontrado: ${response.data.cliente.nombre}`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                // Cliente no encontrado, mostrar formulario
                const confirmar = window.confirm(
                    `No se encontró ningún cliente con DNI: ${dni}\n\n¿Desea registrar un nuevo cliente?`
                );

                if (confirmar) {
                    setNuevoCliente({ ...nuevoCliente, dni: dni });
                    setMostrarFormCliente(true);
                    setClienteSeleccionado(null);
                }
            } else {
                console.error('Error al buscar cliente:', error);
                alert('Error al buscar cliente');
            }
        } finally {
            setLoading(false);
        }
    };

    // ➕ NUEVO: Registrar cliente rápido
    const registrarClienteRapido = async (e) => {
        e.preventDefault();

        if (!nuevoCliente.dni || !nuevoCliente.nombre || !nuevoCliente.apellido) {
            alert('DNI, nombre y apellido son obligatorios');
            return;
        }

        setLoading(true);

        try {
            const response = await ventasService.crearClienteRapido(nuevoCliente);

            if (response.data.success) {
                seleccionarCliente(response.data.cliente);
                setMostrarFormCliente(false);
                setSearchCliente(response.data.cliente.nombre);
                alert('✅ Cliente registrado exitosamente');

                // Limpiar formulario
                setNuevoCliente({
                    dni: '',
                    nombre: '',
                    apellido: '',
                    telefono: '',
                    email: ''
                });
            }
        } catch (error) {
            console.error('Error al registrar cliente:', error);
            alert(error.response?.data?.message || 'Error al registrar cliente');
        } finally {
            setLoading(false);
        }
    };

    // Agregar producto al carrito
    const agregarAlCarrito = (producto) => {
        const existe = carrito.find(item => item.ID_Lote_Stock === producto.ID_Lote_Stock);

        if (existe) {
            if (existe.cantidad < producto.stock) {
                setCarrito(carrito.map(item =>
                    item.ID_Lote_Stock === producto.ID_Lote_Stock
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                ));
            } else {
                alert('No hay suficiente stock disponible');
            }
        } else {
            setCarrito([...carrito, {
                ID_Lote_Stock: producto.ID_Lote_Stock,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                stockDisponible: producto.stock
            }]);
        }

        setSearchProducto('');
        setProductos([]);
        setMostrarProductos(false);
    };

    const eliminarDelCarrito = (idLote) => {
        setCarrito(carrito.filter(item => item.ID_Lote_Stock !== idLote));
    };

    const actualizarCantidad = (idLote, nuevaCantidad) => {
        const producto = carrito.find(item => item.ID_Lote_Stock === idLote);

        if (nuevaCantidad < 1) return;
        if (nuevaCantidad > producto.stockDisponible) {
            alert('Stock insuficiente');
            return;
        }

        setCarrito(carrito.map(item =>
            item.ID_Lote_Stock === idLote
                ? { ...item, cantidad: nuevaCantidad }
                : item
        ));
    };

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);
        setSearchCliente(cliente.nombre);
        setClientes([]);
        setMostrarClientes(false);
        setMostrarFormCliente(false);
    };

    const calcularSubtotal = () => {
        return carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    };

    const calcularIGV = () => {
        return calcularSubtotal() * 0.18;
    };

    const calcularTotal = () => {
        return calcularSubtotal() + calcularIGV();
    };

    const procesarVenta = async () => {
        if (carrito.length === 0) {
            alert('Debe agregar al menos un producto');
            return;
        }

        setLoading(true);

        try {
            const ventaData = {
                productos: carrito.map(item => ({
                    idLote: item.ID_Lote_Stock,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio
                })),
                cliente: clienteSeleccionado?.ID_Cliente || null,
                tipoPago: 'TPA_EFECTIVO'
            };

            const response = await ventasService.create(ventaData);

            alert(`¡Venta registrada exitosamente!\nBoleta: ${response.data.boletaNumber}\nTotal: S/ ${response.data.total?.toFixed(2) || (calcularTotal().toFixed(2))}`);

            if (onVentaCreada) onVentaCreada();
            if (onClose) onClose();

        } catch (error) {
            console.error('Error al procesar venta:', error);
            alert('Error al procesar la venta: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Efecto para búsqueda de productos con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchProducto) {
                buscarProductos(searchProducto);
            } else {
                setProductos([]);
                setMostrarProductos(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchProducto]);

    // Efecto para búsqueda de clientes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchCliente && !clienteSeleccionado) {
                buscarClientes(searchCliente);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchCliente]);

    // Cerrar dropdowns al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.input-con-resultados')) {
                setMostrarProductos(false);
                setMostrarClientes(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="modal-overlay">
            <div className="modal-nueva-venta">
                <div className="modal-header">
                    <h2>🛒 Nueva Venta</h2>
                    <button className="btn-cerrar" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* SECCIÓN BÚSQUEDA */}
                    <div className="seccion-busqueda">
                        {/* Búsqueda de Cliente */}
                        <div className="campo-busqueda">
                            <label>Cliente (opcional)</label>
                            <div className="input-con-resultados">
                                <div className="input-con-boton">
                                    <input
                                        type="text"
                                        placeholder="Buscar por DNI o nombre..."
                                        value={searchCliente}
                                        onChange={(e) => {
                                            setSearchCliente(e.target.value);
                                            if (!e.target.value) {
                                                setClienteSeleccionado(null);
                                                setMostrarFormCliente(false);
                                            }
                                        }}
                                        onFocus={() => searchCliente && !clienteSeleccionado && setMostrarClientes(true)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && searchCliente.length >= 8 && /^\d+$/.test(searchCliente)) {
                                                buscarClientePorDNI(searchCliente);
                                            }
                                        }}
                                        disabled={loading}
                                    />
                                    <button
                                        className="btn-buscar-dni"
                                        onClick={() => buscarClientePorDNI(searchCliente)}
                                        title="Buscar por DNI exacto"
                                        disabled={loading || searchCliente.length < 8}
                                    >
                                        🔍
                                    </button>
                                </div>

                                {clienteSeleccionado && !mostrarFormCliente && (
                                    <div className="cliente-seleccionado">
                                        <div className="cliente-info">
                                            <strong>✓ {clienteSeleccionado.nombre}</strong>
                                            <span>DNI: {clienteSeleccionado.dni}</span>
                                            {clienteSeleccionado.puntos > 0 && (
                                                <span className="puntos">🎁 {clienteSeleccionado.puntos} puntos</span>
                                            )}
                                        </div>
                                        <button
                                            className="btn-cambiar-cliente"
                                            onClick={() => {
                                                setClienteSeleccionado(null);
                                                setSearchCliente('');
                                            }}
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                )}

                                {mostrarClientes && clientes.length > 0 && !clienteSeleccionado && (
                                    <div className="resultados-busqueda">
                                        {clientes.map(cliente => (
                                            <div
                                                key={cliente.ID_Cliente}
                                                className="resultado-item"
                                                onClick={() => seleccionarCliente(cliente)}
                                            >
                                                <strong>{cliente.nombre}</strong>
                                                <span>DNI: {cliente.dni}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ➕ FORMULARIO NUEVO CLIENTE */}
                                {mostrarFormCliente && (
                                    <div className="form-nuevo-cliente">
                                        <h4>📝 Registrar Nuevo Cliente</h4>
                                        <form onSubmit={registrarClienteRapido}>
                                            <div className="form-grid">
                                                <input
                                                    type="text"
                                                    placeholder="DNI *"
                                                    required
                                                    maxLength="20"
                                                    value={nuevoCliente.dni}
                                                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, dni: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Nombre *"
                                                    required
                                                    maxLength="100"
                                                    value={nuevoCliente.nombre}
                                                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Apellido *"
                                                    required
                                                    maxLength="100"
                                                    value={nuevoCliente.apellido}
                                                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })}
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="Teléfono"
                                                    maxLength="20"
                                                    value={nuevoCliente.telefono}
                                                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email (opcional)"
                                                    maxLength="100"
                                                    value={nuevoCliente.email}
                                                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMostrarFormCliente(false);
                                                        setSearchCliente('');
                                                        setNuevoCliente({
                                                            dni: '',
                                                            nombre: '',
                                                            apellido: '',
                                                            telefono: '',
                                                            email: ''
                                                        });
                                                    }}
                                                    disabled={loading}
                                                >
                                                    Cancelar
                                                </button>
                                                <button type="submit" disabled={loading}>
                                                    {loading ? 'Guardando...' : '✅ Guardar Cliente'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Búsqueda de Producto */}
                        <div className="campo-busqueda">
                            <label>Buscar producto</label>
                            <div className="input-con-resultados">
                                <input
                                    type="text"
                                    placeholder="Código de barras o nombre..."
                                    value={searchProducto}
                                    onChange={(e) => setSearchProducto(e.target.value)}
                                    onFocus={() => searchProducto && setMostrarProductos(true)}
                                    autoFocus
                                />
                                {mostrarProductos && productos.length > 0 && (
                                    <div className="resultados-busqueda">
                                        {productos.map(producto => (
                                            <div
                                                key={producto.ID_Lote_Stock}
                                                className="resultado-item producto-item"
                                                onClick={() => agregarAlCarrito(producto)}
                                            >
                                                <div className="producto-info">
                                                    <strong>{producto.nombre}</strong>
                                                    <span className="producto-proveedor">{producto.proveedor}</span>
                                                </div>
                                                <div className="producto-detalles">
                                                    <span className="producto-precio">S/ {producto.precio.toFixed(2)}</span>
                                                    <span className="producto-stock">Stock: {producto.stock}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {mostrarProductos && productos.length === 0 && searchProducto && (
                                    <div className="resultados-busqueda">
                                        <div className="resultado-item no-resultados">
                                            No se encontraron productos
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CARRITO */}
                    <div className="seccion-carrito">
                        <h3>Carrito de Compras ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})</h3>

                        {carrito.length === 0 ? (
                            <div className="carrito-vacio">
                                <p>🛒 El carrito está vacío</p>
                                <p className="texto-ayuda">Busca y agrega productos para comenzar</p>
                            </div>
                        ) : (
                            <div className="tabla-carrito">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Precio Unit.</th>
                                            <th>Cantidad</th>
                                            <th>Subtotal</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carrito.map(item => (
                                            <tr key={item.ID_Lote_Stock}>
                                                <td>{item.nombre}</td>
                                                <td>S/ {item.precio.toFixed(2)}</td>
                                                <td>
                                                    <div className="cantidad-control">
                                                        <button
                                                            onClick={() => actualizarCantidad(item.ID_Lote_Stock, item.cantidad - 1)}
                                                            disabled={item.cantidad <= 1}
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.cantidad}
                                                            onChange={(e) => actualizarCantidad(item.ID_Lote_Stock, parseInt(e.target.value) || 1)}
                                                            min="1"
                                                            max={item.stockDisponible}
                                                        />
                                                        <button
                                                            onClick={() => actualizarCantidad(item.ID_Lote_Stock, item.cantidad + 1)}
                                                            disabled={item.cantidad >= item.stockDisponible}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <small>Max: {item.stockDisponible}</small>
                                                </td>
                                                <td className="subtotal">S/ {(item.precio * item.cantidad).toFixed(2)}</td>
                                                <td>
                                                    <button
                                                        className="btn-eliminar"
                                                        onClick={() => eliminarDelCarrito(item.ID_Lote_Stock)}
                                                        title="Eliminar"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* TOTALES */}
                    {carrito.length > 0 && (
                        <div className="seccion-totales">
                            <div className="total-item">
                                <span>Subtotal:</span>
                                <span>S/ {calcularSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="total-item">
                                <span>IGV (18%):</span>
                                <span>S/ {calcularIGV().toFixed(2)}</span>
                            </div>
                            <div className="total-item total-final">
                                <span>TOTAL:</span>
                                <span>S/ {calcularTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="modal-footer">
                    <button className="btn-cancelar" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        className="btn-procesar"
                        onClick={procesarVenta}
                        disabled={carrito.length === 0 || loading}
                    >
                        {loading ? 'Procesando...' : `Procesar Venta - S/ ${calcularTotal().toFixed(2)}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NuevaVenta;
