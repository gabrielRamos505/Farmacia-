import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Clock,
    TrendingUp,
    FileText
} from 'lucide-react';
import { dashboardService } from '../services/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, delay, subtitle }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 scale-150 transition-transform duration-500 group-hover:scale-125 transform translate-x-12 translate-y-[-12px] rounded-full ${color}`} />

        <div className="flex justify-between items-start relative z-10">
            <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
                <Icon className="w-6 h-6" />
            </div>
            {trend && (
                <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{trendValue}</span>
                </div>
            )}
        </div>

        <div className="mt-6 relative z-10">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">{value}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-2 font-medium">{subtitle}</p>}
        </div>
    </motion.div>
);

const DashboardFarmaceutico = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [productosMasVendidos, setProductosMasVendidos] = useState([]);
    const [rotacionProductos, setRotacionProductos] = useState([]);
    const [alertas, setAlertas] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const [statsRes, productosRes, rotacionRes, alertasRes] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getRankingProductos('mes', 'mas'),
                dashboardService.getRotacionProductos(),
                dashboardService.getAlertas()
            ]);

            setStats(statsRes.data);
            setProductosMasVendidos(productosRes.data.slice(0, 5));
            setRotacionProductos(rotacionRes.data.slice(0, 10));
            setAlertas(alertasRes.data);

        } catch (error) {
            console.error('Error al cargar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                    Panel Farmacéutico 💊
                </h2>
                <p className="text-gray-500 font-medium text-lg mt-1">
                    Control de medicamentos y gestión de inventario
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Ingresos del Día"
                    value={`S/ ${stats?.ventasHoy || '0.00'}`}
                    icon={DollarSign}
                    trend="up"
                    trendValue={`${stats?.cambioVentas || 0}%`}
                    color="bg-blue-600"
                    delay={0.1}
                    subtitle="vs ayer"
                />
                <StatCard
                    title="Productos Vendidos"
                    value={stats?.productosVendidos || 0}
                    icon={Package}
                    color="bg-emerald-500"
                    delay={0.2}
                    subtitle="unidades hoy"
                />
                <StatCard
                    title="Stock Bajo"
                    value={alertas?.productosStockBajo?.length || 0}
                    icon={AlertTriangle}
                    trend="down"
                    trendValue="Urgente"
                    color="bg-amber-500"
                    delay={0.3}
                    subtitle="productos"
                />
                <StatCard
                    title="Por Vencer"
                    value={alertas?.productosProximosVencer?.length || 0}
                    icon={Clock}
                    color="bg-red-500"
                    delay={0.4}
                    subtitle="próximos 30 días"
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Top Productos */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-shadow duration-300"
                >
                    <h3 className="text-xl font-black text-gray-900 mb-6">Productos Más Vendidos</h3>
                    <div className="h-[300px] w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={productosMasVendidos} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} />
                                <YAxis
                                    type="category"
                                    dataKey="nombre"
                                    width={150}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: 700 }}
                                />
                                <Tooltip />
                                <Bar dataKey="cantidadVendida" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Rotación de Productos */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-shadow duration-300"
                >
                    <h3 className="text-xl font-black text-gray-900 mb-6">Análisis de Rotación</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {rotacionProductos.map((producto, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-sm">{producto.nombre}</p>
                                    <p className="text-xs text-gray-500">{producto.laboratorio}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${producto.clasificacion === 'Rotación Alta' ? 'bg-emerald-100 text-emerald-700' :
                                        producto.clasificacion === 'Rotación Media' ? 'bg-blue-100 text-blue-700' :
                                            producto.clasificacion === 'Rotación Baja' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {producto.clasificacion}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">{Math.round(producto.diasInventario)} días</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Productos por vencer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-red-50 p-6 rounded-3xl border border-red-100"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <Clock className="w-6 h-6 text-red-600" />
                        <h4 className="font-black text-gray-900">Productos Próximos a Vencer</h4>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {alertas?.productosProximosVencer?.slice(0, 5).map((producto, index) => (
                            <div key={index} className="bg-white p-3 rounded-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{producto.nombre}</p>
                                        <p className="text-xs text-gray-500">Lote: {producto.lote}</p>
                                    </div>
                                    <span className="text-xs font-black text-red-600">
                                        {producto.diasRestantes} días
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Stock bajo */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-amber-50 p-6 rounded-3xl border border-amber-100"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                        <h4 className="font-black text-gray-900">Stock Bajo</h4>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {alertas?.productosStockBajo?.slice(0, 5).map((producto, index) => (
                            <div key={index} className="bg-white p-3 rounded-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{producto.nombre}</p>
                                        <p className="text-xs text-gray-500">{producto.laboratorio}</p>
                                    </div>
                                    <span className="text-xs font-black text-amber-600">
                                        {producto.stockTotal} unds.
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardFarmaceutico;
