import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    AlertTriangle,
    Clock,
    TrendingDown,
    Boxes,
    Truck,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { dashboardService } from '../services/api';

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

const DashboardAlmacenero = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [alertas, setAlertas] = useState(null);
    const [rotacion, setRotacion] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const [statsRes, alertasRes, rotacionRes] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getAlertas(),
                dashboardService.getRotacionProductos()
            ]);

            setStats(statsRes.data);
            setAlertas(alertasRes.data);
            setRotacion(rotacionRes.data);

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

    const productosSinStock = rotacion.filter(p => p.clasificacion === 'Sin Stock').length;
    const productosSinMovimiento = rotacion.filter(p => p.clasificacion === 'Sin Movimiento').length;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                    Panel de Almacén 📦
                </h2>
                <p className="text-gray-500 font-medium text-lg mt-1">
                    Control de stock e inventario
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Total de Productos"
                    value={stats?.totalProductos || 0}
                    icon={Package}
                    color="bg-blue-600"
                    delay={0.1}
                    subtitle="en inventario"
                />
                <StatCard
                    title="Stock Bajo"
                    value={alertas?.productosStockBajo?.length || 0}
                    icon={AlertTriangle}
                    trend="down"
                    trendValue="Urgente"
                    color="bg-amber-500"
                    delay={0.2}
                    subtitle="productos críticos"
                />
                <StatCard
                    title="Próximos a Vencer"
                    value={alertas?.productosProximosVencer?.length || 0}
                    icon={Clock}
                    trend="down"
                    trendValue="30 días"
                    color="bg-red-500"
                    delay={0.3}
                    subtitle="lotes"
                />
                <StatCard
                    title="Sin Movimiento"
                    value={productosSinMovimiento}
                    icon={TrendingDown}
                    color="bg-gray-500"
                    delay={0.4}
                    subtitle="productos"
                />
            </div>

            {/* Alertas Principales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stock Crítico */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-red-50 p-6 rounded-3xl border-2 border-red-200"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-900">Stock Crítico</h4>
                            <p className="text-xs text-red-600 font-bold">Requiere atención inmediata</p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {alertas?.productosStockBajo?.slice(0, 8).map((producto, index) => (
                            <div key={index} className="bg-white p-3 rounded-xl border border-red-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-900">{producto.nombre}</p>
                                        <p className="text-xs text-gray-500">{producto.laboratorio}</p>
                                    </div>
                                    <div className="text-right ml-2">
                                        <span className="text-sm font-black text-red-600">{producto.stockTotal}</span>
                                        <p className="text-[10px] text-gray-400">/{producto.stockMinimo} mín</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Próximos a Vencer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-900">Por Vencer</h4>
                            <p className="text-xs text-amber-600 font-bold">Próximos 30 días</p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {alertas?.productosProximosVencer?.slice(0, 8).map((producto, index) => (
                            <div key={index} className="bg-white p-3 rounded-xl border border-amber-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-900">{producto.nombre}</p>
                                        <p className="text-xs text-gray-500">Lote: {producto.lote}</p>
                                    </div>
                                    <div className="text-right ml-2">
                                        <span className="text-sm font-black text-amber-600">{producto.diasRestantes}d</span>
                                        <p className="text-[10px] text-gray-400">{producto.stock} unds</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Sin Movimiento */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-200"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gray-500 rounded-2xl flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-900">Sin Movimiento</h4>
                            <p className="text-xs text-gray-600 font-bold">Últimos 30 días</p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {rotacion.filter(p => p.clasificacion === 'Sin Movimiento').slice(0, 8).map((producto, index) => (
                            <div key={index} className="bg-white p-3 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-900">{producto.nombre}</p>
                                        <p className="text-xs text-gray-500">{producto.laboratorio}</p>
                                    </div>
                                    <div className="text-right ml-2">
                                        <span className="text-sm font-black text-gray-600">{producto.stockActual}</span>
                                        <p className="text-[10px] text-gray-400">stock</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Resumen de Rotación */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl"
            >
                <div className="flex items-center space-x-3 mb-6">
                    <Boxes className="w-8 h-8" />
                    <h3 className="text-2xl font-black">Resumen de Rotación de Inventario</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <p className="text-sm font-medium opacity-90">Rotación Alta</p>
                        <p className="text-3xl font-black mt-2">
                            {rotacion.filter(p => p.clasificacion === 'Rotación Alta').length}
                        </p>
                        <p className="text-xs opacity-75 mt-1">productos</p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <p className="text-sm font-medium opacity-90">Rotación Media</p>
                        <p className="text-3xl font-black mt-2">
                            {rotacion.filter(p => p.clasificacion === 'Rotación Media').length}
                        </p>
                        <p className="text-xs opacity-75 mt-1">productos</p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <p className="text-sm font-medium opacity-90">Rotación Baja</p>
                        <p className="text-3xl font-black mt-2">
                            {rotacion.filter(p => p.clasificacion === 'Rotación Baja').length}
                        </p>
                        <p className="text-xs opacity-75 mt-1">productos</p>
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <p className="text-sm font-medium opacity-90">Sin Stock</p>
                        <p className="text-3xl font-black mt-2">{productosSinStock}</p>
                        <p className="text-xs opacity-75 mt-1">productos</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardAlmacenero;
