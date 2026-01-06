import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Configuración de axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Servicios de Autenticación
export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
};

// Servicios de Dashboard
export const dashboardService = {
    getStats: () => api.get('/dashboard/stats'),
    getVentasSemanales: (dias = 7) => api.get(`/dashboard/ventas-semana?dias=${dias}`),
    getTopProductos: () => api.get('/dashboard/top-productos'),
    getMetodosPago: (periodo = 'hoy') => api.get(`/dashboard/metodos-pago?periodo=${periodo}`),
    getUltimasVentas: () => api.get('/dashboard/ultimas-ventas'),
    getAlertas: () => api.get('/dashboard/alertas'),
    getDashboardAvanzado: (periodo = 'mes') => api.get(`/dashboard/avanzado?periodo=${periodo}`),

    // Métodos detallados de análisis (opcionales para dashboards específicos)
    getTopEmpleados: (periodo = 'mes') => api.get(`/dashboard/top-empleados?periodo=${periodo}`),
    getRendimientoEmpleado: (empleadoId, periodo = 'mes') =>
        api.get(`/dashboard/rendimiento-empleado/${empleadoId}?periodo=${periodo}`),
    getRankingProductos: (periodo = 'mes', tipo = 'mas') =>
        api.get(`/dashboard/ranking-productos?periodo=${periodo}&tipo=${tipo}`),
    getRotacionProductos: () => api.get('/dashboard/rotacion-productos'),
    getClientesFrecuentes: (periodo = 'mes') =>
        api.get(`/dashboard/clientes-frecuentes?periodo=${periodo}`),
    getClientesVIP: (periodo = 'mes') =>
        api.get(`/dashboard/clientes-vip?periodo=${periodo}`),
    getVentasPorHora: (periodo = 'semana') =>
        api.get(`/dashboard/ventas-por-hora?periodo=${periodo}`),
    getVentasPorDiaSemana: (periodo = 'mes') =>
        api.get(`/dashboard/ventas-por-dia-semana?periodo=${periodo}`),
    getComparativaMensual: (meses = 6) =>
        api.get(`/dashboard/comparativa-mensual?meses=${meses}`),
};

// Servicios de Inventario
export const inventoryService = {
    getAll: () => api.get('/inventory'),
    getById: (id) => api.get(`/inventory/${id}`),
    create: (data) => api.post('/inventory', data),
    update: (id, data) => api.put(`/inventory/${id}`, data),
    delete: (id) => api.delete(`/inventory/${id}`),
    search: (query) => api.get(`/inventory/search?q=${query}`),
    getLowStock: () => api.get('/inventory/low-stock'),
};

// Servicios de Lotes/Stock ← NUEVO
export const lotesService = {
    getAll: () => api.get('/lotes'),
    getByProducto: (productoId) => api.get(`/lotes/producto/${productoId}`),
    getProximosVencer: (dias = 30) => api.get(`/lotes/proximos-vencer?dias=${dias}`),
    create: (data) => api.post('/lotes', data),
    update: (id, data) => api.put(`/lotes/${id}`, data),
};

// Servicios de Productos ← NUEVO
export const productosService = {
    getAll: () => api.get('/productos'),
    getCategorias: () => api.get('/productos/categorias'),
    create: (data) => api.post('/productos', data),
    update: (id, data) => api.put(`/productos/${id}`, data),
    delete: (id) => api.delete(`/productos/${id}`),
};

// Servicios de Proveedores ← NUEVO
export const proveedoresService = {
    getAll: () => api.get('/proveedores'),
    create: (data) => api.post('/proveedores', data),
    update: (id, data) => api.put(`/proveedores/${id}`, data),
    delete: (id) => api.delete(`/proveedores/${id}`),
};

// Servicios de Ventas
export const salesService = {
    getAll: () => api.get('/sales'),
    getById: (id) => api.get(`/sales/${id}`),
    create: (data) => api.post('/sales', data),
    update: (id, data) => api.put(`/sales/${id}`, data),
    delete: (id) => api.delete(`/sales/${id}`),
    getByDate: (startDate, endDate) =>
        api.get(`/sales/range?start=${startDate}&end=${endDate}`),
    getSummary: () => api.get('/sales/summary'),
};

// Servicios de Ventas/POS centralizados
export const ventasService = {
    searchProductos: (search) => api.get(`/ventas/search-productos?search=${search}`),
    searchClientes: (search) => api.get(`/ventas/search-clientes?search=${search}`),
    buscarClientePorDNI: (dni) => api.get(`/clientes/buscar-dni/${dni}`),
    crearClienteRapido: (data) => api.post('/clientes/crear-rapido', data),
    create: (data) => api.post('/ventas', data),
    getAll: () => api.get('/ventas'),
};

// Servicios de Usuarios
export const userService = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    changePassword: (id, data) => api.put(`/users/${id}/password`, data),
};

export default api;
