import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    AlertTriangle,
    Clock,
    Boxes,
    ShoppingCart
} from 'lucide-react';
import { dashboardService } from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, delay, subtitle }) => (
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
        </div>

        <div className="mt-6 relative z-10">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">{value}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-2 font-medium">{subtitle}</p>}
        </div>
    </motion.div>
);

const DashboardAuxiliar = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [alertas, setAlertas] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [statsRes, alertasRes] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getAlertas()
            ]);
            setStats(statsRes.data);
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
                    Panel Auxiliar 👋
                </h2>
                <p className="text-gray-500 font-medium text-lg mt-1">
                    Apoyo en tareas de inventario y ventas
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
                    subtitle="en catálogo"
                />
                <StatCard
                    title="Productos Stock Bajo"
                    value={alertas?.productosStockBajo?.length || 0}
                    icon={AlertTriangle}
                    color="bg-amber-500"
                    delay={0.2}
                    subtitle="necesitan reposición"
                />
                <StatCard
                    title="Lotes por Vencer"
                    value={alertas?.productosProximosVencer?.length || 0}
                    icon={Clock}
                    color="bg-red-500"
                    delay={0.3}
                    subtitle="próximos 30 días"
                />
                <StatCard
                    title="Ventas del Día"
                    value={`S/ ${stats?.ventasHoy || '0.00'}`}
                    icon={ShoppingCart}
                    color="bg-emerald-500"
                    delay={0.4}
                    subtitle="total general"
                />
            </div>

            {/* Tareas Pendientes o Alertas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <Package className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-black text-gray-900">Reposición Urgente</h3>
                    </div>
                    <div className="space-y-4">
                        {alertas?.productosStockBajo?.slice(0, 5).map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-bold text-gray-900">{p.nombre}</p>
                                    <p className="text-xs text-gray-500">{p.laboratorio}</p>
                                </div>
                                <span className="text-sm font-black text-red-600">{p.stockTotal}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <Clock className="w-6 h-6 text-orange-600" />
                        <h3 className="text-xl font-black text-gray-900">Revisión de Fecha</h3>
                    </div>
                    <div className="space-y-4">
                        {alertas?.productosProximosVencer?.slice(0, 5).map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-bold text-gray-900">{p.nombre}</p>
                                    <p className="text-xs text-gray-500">Lote: {p.lote}</p>
                                </div>
                                <span className="text-sm font-black text-orange-600">{p.diasRestantes}d</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardAuxiliar;
