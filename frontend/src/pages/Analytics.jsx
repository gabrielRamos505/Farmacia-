import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { hasPermission } from '../utils/permissions';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import {
    TrendingUp, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight,
    Calendar, Activity, Loader2, Award, Zap, Clock, ShoppingCart, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardService } from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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

const Analytics = () => {
    if (!hasPermission('VIEW_ANALYTICS')) {
        return <Navigate to="/dashboard" replace />;
    }

    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState('mes'); // hoy, semana, mes, año
    const [data, setData] = useState({
        resumen: null,
        ventasHora: [],
        rankingProductos: [],
        clientesVIP: [],
        comparativa: []
    });

    useEffect(() => {
        loadAnalytics();
    }, [periodo]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [avanzadoRes, horaRes, rankingRes, vipRes, compRes] = await Promise.allSettled([
                dashboardService.getDashboardAvanzado(periodo),
                dashboardService.getVentasPorHora(periodo),
                dashboardService.getRankingProductos(periodo, 'mas'),
                dashboardService.getClientesVIP(periodo),
                dashboardService.getComparativaMensual(6)
            ]);

            console.log("📊 BI Data - Resumen:", avanzadoRes.value?.data);
            console.log("📊 BI Data - Comparativa:", compRes.value?.data);

            setData({
                resumen: avanzadoRes.status === 'fulfilled' ? (avanzadoRes.value?.data || null) : null,
                ventasHora: horaRes.status === 'fulfilled' ? (horaRes.value?.data?.ventasPorHora || []) : [],
                rankingProductos: rankingRes.status === 'fulfilled' ? (rankingRes.value?.data || []) : [],
                clientesVIP: vipRes.status === 'fulfilled' ? (vipRes.value?.data || []) : [],
                comparativa: compRes.status === 'fulfilled' ? (compRes.value?.data?.comparativa || []) : []
            });

        } catch (error) {
            console.error('Error al cargar analíticas:', error);
            toast.error('Error al cargar los datos de análisis');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-bold text-xl animate-pulse">Cargando Análisis Avanzado...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                        <Zap className="w-10 h-10 text-blue-600 fill-blue-600" />
                        Business Intelligence
                    </h2>
                    <p className="text-gray-500 font-medium text-lg mt-1 italic">
                        Análisis profundo del rendimiento de tu farmacia
                    </p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    {['hoy', 'semana', 'mes'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriodo(p)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest ${periodo === p
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Ventas Totales"
                    value={`S/ ${parseFloat(data.resumen?.ventasTotales || 0).toLocaleString()}`}
                    icon={DollarSign}
                    trend="up"
                    trendValue="+12.5%"
                    color="bg-blue-600"
                    delay={0.1}
                    subtitle={`Periodo: ${periodo}`}
                />
                <StatCard
                    title="Ticket Promedio"
                    value={`S/ ${parseFloat(data.resumen?.ticketPromedio || 0).toFixed(2)}`}
                    icon={ShoppingCart}
                    trend="up"
                    trendValue="+5.2%"
                    color="bg-emerald-500"
                    delay={0.2}
                    subtitle="por transacción"
                />
                <StatCard
                    title="Nuevos Clientes"
                    value={data.resumen?.nuevosClientes || 0}
                    icon={Users}
                    trend="up"
                    trendValue="+18%"
                    color="bg-amber-500"
                    delay={0.3}
                    subtitle="registrados"
                />
                <StatCard
                    title="Progreso de Meta"
                    value="84%"
                    icon={Target}
                    color="bg-violet-600"
                    delay={0.4}
                    subtitle="objetivos mensuales"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Ventas por Hora */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-blue-600" />
                                Patrón de Ventas por Hora
                            </h3>
                            <p className="text-gray-400 font-medium text-sm">Identifica las horas pico de demanda</p>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        {data.ventasHora.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={Array.isArray(data.ventasHora) ? data.ventasHora : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                    />
                                    <Area type="monotone" dataKey="numeroVentas" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVentas)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                <Clock className="w-12 h-12 text-gray-200 mb-4" />
                                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No hay datos de ventas</p>
                                <p className="text-gray-400 text-xs font-medium mt-1">Para el periodo: {periodo}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Comparativa Mensual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Activity className="w-6 h-6 text-violet-600" />
                                Evolución de Ingresos
                            </h3>
                            <p className="text-gray-400 font-medium text-sm">Últimos 6 meses de facturación</p>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        {data.comparativa.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={Array.isArray(data.comparativa) ? data.comparativa : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                    />
                                    <Bar dataKey="totalIngresos" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                <Activity className="w-12 h-12 text-gray-200 mb-4" />
                                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Sin historial disponible</p>
                                <p className="text-gray-400 text-xs font-medium mt-1">Se requiere al menos un mes de datos</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Ranking Productos */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm overflow-hidden">
                    <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
                        <Award className="w-6 h-6 text-amber-500" />
                        Top Productos con Mayor Margen
                    </h3>
                    <div className="space-y-6">
                        {(Array.isArray(data.rankingProductos) ? data.rankingProductos : []).length > 0 ? (
                            (Array.isArray(data.rankingProductos) ? data.rankingProductos : []).slice(0, 5).map((prod, idx) => (
                                <div key={idx} className="flex items-center gap-6 group">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{prod.nombre}</p>
                                            <p className="font-black text-gray-900">S/ {parseFloat(prod.totalIngresos).toLocaleString()}</p>
                                        </div>
                                        <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${parseFloat(data.rankingProductos[0]?.totalIngresos) > 0 ? (parseFloat(prod.totalIngresos) / parseFloat(data.rankingProductos[0].totalIngresos)) * 100 : 0}%` }}
                                                transition={{ duration: 1 }}
                                                className={`h-full rounded-full ${idx === 0 ? 'bg-amber-400' : 'bg-blue-500'}`}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{prod.laboratorio}</span>
                                            <span className="text-[10px] font-black text-blue-600 uppercase">{prod.cantidadVendida} unidades</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <Package className="w-16 h-16 mb-4" />
                                <p className="font-black uppercase tracking-widest text-sm">Sin productos registrados</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Clientes VIP */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full -translate-y-32 translate-x-32" />

                    <h3 className="text-xl font-black mb-8 flex items-center gap-2 relative z-10">
                        <Award className="w-6 h-6 text-blue-400" />
                        Club de Clientes VIP
                    </h3>

                    <div className="space-y-6 relative z-10">
                        {(Array.isArray(data.clientesVIP) ? data.clientesVIP : []).slice(0, 5).map((cli, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-black text-white text-lg ring-4 ring-blue-500/20">
                                    {cli.nombre[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{cli.nombre}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-black rounded uppercase">
                                            RANKING #{cli.ranking}
                                        </span>
                                        <span className="text-gray-400 text-xs font-medium">S/ {parseFloat(cli.totalGastado).toFixed(0)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-400 font-black text-xs uppercase">Puntos</p>
                                    <p className="font-black text-lg leading-none">{cli.puntosFidelidad}</p>
                                </div>
                            </div>
                        ))}

                        {data.clientesVIP.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <Users className="w-12 h-12 mx-auto mb-3" />
                                <p>No hay datos suficientes</p>
                            </div>
                        )}
                    </div>

                    <Link
                        to="/clientes"
                        className="block w-full text-center mt-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40"
                    >
                        Ver Lista Completa
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
