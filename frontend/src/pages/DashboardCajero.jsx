import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Users,
    Package,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Award,
    Target,
    Clock,
    ShoppingCart
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
    LineChart,
    Line
} from 'recharts';

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

const DashboardCajero = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [rendimiento, setRendimiento] = useState(null);
    const [ventasHora, setVentasHora] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);

            // Cargar rendimiento del cajero
            const rendimientoRes = await dashboardService.getRendimientoEmpleado(user.id, 'mes');
            setRendimiento(rendimientoRes.data);

            // Cargar ventas por hora
            const ventasHoraRes = await dashboardService.getVentasPorHora('hoy');
            setVentasHora(ventasHoraRes.data.ventasPorHora || []);

            // Cargar stats generales
            const statsRes = await dashboardService.getStats();
            setStats(statsRes.data);

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
                    ¡Hola, {user?.nombre}! 👋
                </h2>
                <p className="text-gray-500 font-medium text-lg mt-1">
                    Panel de Control de Caja
                </p>
            </div>

            {/* Stats Cards - Solo métricas del vendedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Mis Ventas del Mes"
                    value={rendimiento?.totalVentas || 0}
                    icon={ShoppingCart}
                    trend="up"
                    trendValue={`S/ ${rendimiento?.totalIngresos || '0.00'}`}
                    color="bg-blue-600"
                    delay={0.1}
                    subtitle="ventas realizadas"
                />
                <StatCard
                    title="Mi Ticket Promedio"
                    value={`S/ ${rendimiento?.ticketPromedio || '0.00'}`}
                    icon={DollarSign}
                    color="bg-emerald-500"
                    delay={0.2}
                    subtitle="por venta"
                />
                <StatCard
                    title="Mi Mejor Venta"
                    value={`S/ ${rendimiento?.ventaMayor || '0.00'}`}
                    icon={Award}
                    trend="up"
                    trendValue="Récord"
                    color="bg-amber-500"
                    delay={0.3}
                />
                <StatCard
                    title="Días Trabajados"
                    value={rendimiento?.diasTrabajados || 0}
                    icon={Clock}
                    color="bg-violet-600"
                    delay={0.4}
                    subtitle={`${rendimiento?.promedioVentasPorDia || 0} ventas/día`}
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Mis ventas por hora */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-shadow duration-300"
                >
                    <h3 className="text-xl font-black text-gray-900 mb-6">Mis Ventas por Hora (Hoy)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={ventasHora}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="hora"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '20px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        padding: '15px'
                                    }}
                                />
                                <Bar dataKey="numeroVentas" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Mis objetivos */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <Target className="w-8 h-8" />
                        <h3 className="text-2xl font-black">Mis Objetivos del Mes</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="font-bold">Meta de Ventas</span>
                                <span className="font-black">{rendimiento?.totalVentas || 0}/50</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-3">
                                <div
                                    className="bg-white h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((rendimiento?.totalVentas || 0) / 50 * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="font-bold">Meta de Ingresos</span>
                                <span className="font-black">S/ {rendimiento?.totalIngresos || '0'}/15,000</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-3">
                                <div
                                    className="bg-emerald-400 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((parseFloat(rendimiento?.totalIngresos || 0) / 15000 * 100), 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <p className="text-sm font-medium opacity-90">
                                ¡Sigue así! Estás en camino a cumplir tus objetivos 🎯
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Mensaje motivacional */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-3xl border border-emerald-100"
            >
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900">¡Excelente trabajo!</h4>
                        <p className="text-gray-600 font-medium">
                            Llevas {rendimiento?.totalVentas || 0} ventas este mes.
                            {rendimiento?.promedioVentasPorDia > 2 && " ¡Estás superando el promedio!"}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardCajero;
