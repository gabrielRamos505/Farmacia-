import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  Loader2,
  AlertCircle,
  FileText,
  ShoppingCart,
  AlertTriangle,
  ClipboardCheck,
  Clock,
  Banknote,
  CreditCard,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardService, inventoryService } from '../services/api';
import { getDashboardConfig } from '../utils/permissions';
import NuevaVenta from './NuevaVenta';
import axios from 'axios';

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
        <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
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

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const getUserRole = () => {
    if (user.puesto) return user.puesto;
    if (user.isAdmin) return 'Gerente';
    return 'Vendedor';
  };

  const userRole = getUserRole();
  const dashboardConfig = getDashboardConfig(userRole) || {
    title: 'Panel de Gerencia',
    subtitle: 'Vista completa de la farmacia',
    showFullStats: true,
    showSalesChart: true,
    showDistribution: true,
    showTopProducts: true,
    showAlerts: true,
    showRecentSales: true,
    statsCards: ['revenue', 'clients', 'products', 'pending'],
    canExport: true
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mostrarNuevaVenta, setMostrarNuevaVenta] = useState(false);
  const [stats, setStats] = useState({
    totalVentas: 0,
    totalProductos: 0,
    totalClientes: 0,
    pedidosPendientes: 0,
    ventasHoy: 0,
    productosVendidos: 0,
    clientesAtendidos: 0,
    ticketPromedio: 0,
    cambioVentas: 0
  });
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [ventasPorHora, setVentasPorHora] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [alertas, setAlertas] = useState({
    stockBajo: [],
    porVencer: [],
    sinStock: []
  });
  const [topEmpleados, setTopEmpleados] = useState([]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const results = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getVentasSemanales(),
        dashboardService.getTopProductos(),
        dashboardService.getMetodosPago(),
        dashboardService.getUltimasVentas(),
        dashboardService.getAlertas(),
        inventoryService.getAll(),
        dashboardService.getVentasPorHora('semana'),
        dashboardService.getTopEmpleados('hoy')
      ]);

      const [
        statsRes,
        ventasRes,
        productosRes,
        pagosRes,
        ultimasVentasRes,
        alertasRes,
        invRes,
        horaRes,
        empRes
      ] = results;

      if (statsRes.status === 'fulfilled') {
        const statsData = statsRes.value.data;
        setStats({ ...statsData, ventasHoy: statsData.totalIngresos });
      }

      if (ventasRes.status === 'fulfilled' && ventasRes.value.data) {
        setVentasPorDia(ventasRes.value.data.map(v => ({
          fecha: new Date(v.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          total: parseFloat(v.total) || 0,
          nombre: new Date(v.fecha).toLocaleDateString('es-ES', { weekday: 'short' })
        })));
      }

      if (productosRes.status === 'fulfilled') setTopProductos(productosRes.value.data.slice(0, 5));
      if (pagosRes.status === 'fulfilled') setMetodosPago(pagosRes.value.data);
      if (ultimasVentasRes.status === 'fulfilled') setUltimasVentas(ultimasVentasRes.value.data.slice(0, 10));

      if (alertasRes.status === 'fulfilled' && alertasRes.value.data) {
        setAlertas({
          stockBajo: alertasRes.value.data.productosStockBajo || [],
          porVencer: alertasRes.value.data.productosProximosVencer || [],
          sinStock: []
        });
      }

      if (invRes.status === 'fulfilled') {
        const productos = invRes.value.data;
        const distribucion = {};
        productos.forEach(prod => {
          const lab = prod.PCO_Laboratorio || 'Otros';
          distribucion[lab] = (distribucion[lab] || 0) + 1;
        });
        setPieData(Object.entries(distribucion)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, value]) => ({ name, value })));
      }

      if (horaRes.status === 'fulfilled') setVentasPorHora(horaRes.value.data.ventasPorHora || []);
      if (empRes.status === 'fulfilled') setTopEmpleados(empRes.value.data);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handleExportData = () => {
    const data = {
      stats,
      ventasPorDia,
      topProductos,
      alertas,
      fecha: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStatsCards = () => {
    if (!dashboardConfig.statsCards || dashboardConfig.statsCards.length === 0) {
      return (
        <div className="col-span-4 flex items-center justify-center p-10">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay tarjetas configuradas para este rol</p>
          </div>
        </div>
      );
    }

    const cards = {
      revenue: (
        <StatCard
          key="revenue"
          title="Ventas del Día"
          value={`S/ ${parseFloat(stats.ventasHoy || stats.ventasDelDia || 0).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          icon={DollarSign}
          trend={stats.cambioVentas >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(stats.cambioVentas || stats.porcentajeCambio || 0).toFixed(1)}%`}
          color="bg-blue-600"
          delay={0.1}
          subtitle="vs ayer"
        />
      ),
      clients: (
        <StatCard
          key="clients"
          title="Clientes Atendidos"
          value={stats.clientesAtendidos || stats.totalClientes || 0}
          icon={Users}
          trend="up"
          trendValue="+5.2%"
          color="bg-emerald-500"
          delay={0.2}
          subtitle="hoy"
        />
      ),
      products: (
        <StatCard
          key="products"
          title="Productos Vendidos"
          value={stats.productosVendidos || 0}
          icon={Package}
          trend="up"
          trendValue="+2.1%"
          color="bg-amber-500"
          delay={0.3}
          subtitle="hoy"
        />
      ),
      pending: (
        <StatCard
          key="pending"
          title="Ticket Promedio"
          value={`S/ ${parseFloat(stats.ticketPromedio || 0).toFixed(2)}`}
          icon={TrendingUp}
          color="bg-violet-600"
          delay={0.4}
          subtitle="por venta"
        />
      ),
      todaySales: (
        <StatCard
          key="todaySales"
          title="Mis Ventas Hoy"
          value={`S/ ${parseFloat(stats.ventasHoy || 0).toLocaleString('es-PE', {
            minimumFractionDigits: 2
          })}`}
          icon={ShoppingCart}
          trend="up"
          trendValue="+8.3%"
          color="bg-blue-600"
          delay={0.1}
          subtitle="tus ventas del día"
        />
      ),
      mySales: (
        <StatCard
          key="mySales"
          title="Mis Ventas"
          value={stats.productosVendidos || 0}
          icon={ClipboardCheck}
          trend="up"
          trendValue="+15%"
          color="bg-green-600"
          delay={0.2}
          subtitle="este mes"
        />
      ),
      lowStock: (
        <StatCard
          key="lowStock"
          title="Stock Bajo"
          value={alertas.stockBajo?.length || 0}
          icon={AlertTriangle}
          trend={alertas.stockBajo?.length > 5 ? "up" : "down"}
          trendValue={alertas.stockBajo?.length || 0}
          color="bg-orange-600"
          delay={0.3}
          subtitle="productos críticos"
        />
      ),
      alerts: (
        <StatCard
          key="alerts"
          title="Sin Stock"
          value={alertas.sinStock?.length || 0}
          icon={AlertTriangle}
          color="bg-red-600"
          delay={0.4}
          subtitle="requieren atención"
        />
      ),
      expired: (
        <StatCard
          key="expired"
          title="Por Vencer"
          value={alertas.porVencer?.length || 0}
          icon={Calendar}
          color="bg-orange-600"
          delay={0.4}
          subtitle="próximos 30 días"
        />
      )
    };

    return dashboardConfig.statsCards.map(cardKey => cards[cardKey]).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
            {dashboardConfig.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 font-medium text-lg italic opacity-80">
              {dashboardConfig.subtitle}
            </p>
            <Link to="/analytics" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1 ml-4 bg-blue-50 px-3 py-1 rounded-full">
              <Activity className="w-3 h-3" />
              Ver Análisis Avanzado
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMostrarNuevaVenta(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Nueva Venta</span>
          </motion.button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-white p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {dashboardConfig.canExport && (
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 bg-white p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
              title="Exportar datos"
            >
              <Download className="w-5 h-5 text-blue-600" />
            </button>
          )}

          <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-black text-gray-600">
              {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {mostrarNuevaVenta && (
        <NuevaVenta
          onClose={() => setMostrarNuevaVenta(false)}
          onVentaCreada={() => {
            setMostrarNuevaVenta(false);
            loadDashboardData(true);
          }}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {renderStatsCards()}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ✅ GRÁFICO DE VENTAS CORREGIDO */}
        {dashboardConfig?.showSalesChart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-gray-900">Ventas de los Últimos 7 Días</h3>
                <p className="text-gray-400 font-medium text-sm">Rendimiento semanal</p>
              </div>
            </div>

            {ventasPorDia.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={ventasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="fecha"
                    stroke="#666"
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis stroke="#666" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}
                    formatter={(value) => [`S/ ${value.toFixed(2)}`, 'Total']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Ventas"
                    dot={{ fill: '#3B82F6', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-gray-400 flex-col">
                <Package className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold text-lg">No hay datos de ventas disponibles</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ✅ GRÁFICO DE DISTRIBUCIÓN CORREGIDO */}
        {dashboardConfig?.showDistribution && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center space-x-3 mb-10">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Distribución por Laboratorio</h3>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-10">
              <div className="h-[250px] w-full md:w-[250px] relative">
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={10}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-gray-900">
                        {pieData.reduce((sum, item) => sum + item.value, 0)}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No hay datos
                  </div>
                )}
              </div>
              <div className="space-y-4 w-full md:w-auto">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between md:justify-start group cursor-default">
                    <div className="flex items-center">
                      <div
                        className="w-3.5 h-3.5 rounded-full mr-3 shadow-md transition-transform group-hover:scale-125"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-tight">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-black text-gray-900 ml-8">{item.value} uts.</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Top Productos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ✅ Top Productos CORREGIDO */}
        {dashboardConfig?.showTopProducts && topProductos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-shadow duration-300"
          >
            <h3 className="text-xl font-black text-gray-900 mb-6">Top 5 Productos Más Vendidos</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="nombre"
                  stroke="#666"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#666" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}
                />
                <Bar dataKey="cantidad" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                  {topProductos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Alertas */}
        {dashboardConfig?.showAlerts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-shadow duration-300"
          >
            <h3 className="text-xl font-black text-gray-900 mb-6">Alertas Importantes</h3>
            <div className="space-y-4">
              {alertas.sinStock.length > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-red-900">Productos sin stock</p>
                    <p className="text-sm text-red-700 mt-1">
                      {alertas.sinStock.length} productos sin disponibilidad
                    </p>
                  </div>
                </div>
              )}
              {alertas.stockBajo.length > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <Package className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-yellow-900">Stock bajo</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {alertas.stockBajo.length} productos con stock mínimo
                    </p>
                  </div>
                </div>
              )}
              {alertas.porVencer.length > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <Calendar className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-orange-900">Próximos a vencer</p>
                    <p className="text-sm text-orange-700 mt-1">
                      {alertas.porVencer.length} productos vencen en 30 días
                    </p>
                  </div>
                </div>
              )}
              {alertas.sinStock.length === 0 && alertas.stockBajo.length === 0 && alertas.porVencer.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium">✅ No hay alertas pendientes</p>
                  <p className="text-sm text-gray-400 mt-2">Todo funcionando correctamente</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Últimas Ventas */}
      {dashboardConfig?.showRecentSales && ultimasVentas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-xl font-black text-gray-900">Últimas Ventas del Día</h3>
            <p className="text-gray-400 font-medium text-sm mt-1">Transacciones recientes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase">Hora</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase">Productos</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase">Método</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ultimasVentas.map((venta, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(venta.fecha).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {venta.cliente || 'Cliente General'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {venta.productos} {venta.productos === 1 ? 'producto' : 'productos'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${venta.metodoPago === 'Efectivo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {venta.metodoPago === 'Efectivo' ? (
                          <Banknote className="w-3 h-3 mr-1" />
                        ) : (
                          <CreditCard className="w-3 h-3 mr-1" />
                        )}
                        {venta.metodoPago}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      S/ {parseFloat(venta.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ✅ GRÁFICO DE PATRÓN DE VENTAS (HORAS) - NIVEL AVANZADO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-shadow duration-300 mt-10"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-violet-50 rounded-2xl">
              <Clock className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Patrón de Ventas Diario</h3>
              <p className="text-gray-400 font-medium text-xs">Identifica las horas pico de demanda en tu farmacia</p>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={Array.isArray(ventasPorHora) ? ventasPorHora : []}>
              <defs>
                <linearGradient id="colorHora" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
              />
              <Area
                type="monotone"
                dataKey="numeroVentas"
                name="Ventas"
                stroke="#8b5cf6"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorHora)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ✅ MONITOREO DE PERSONAL - NUEVA SECCIÓN */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden hover:shadow-xl transition-shadow duration-300 mt-10"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900">Monitoreo de Personal</h3>
            <p className="text-gray-400 font-medium text-sm mt-1">Rendimiento y salarios del equipo (Hoy)</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-xl text-blue-600 font-black text-sm">
            {topEmpleados.length} Empleados Activos
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase">Colaborador</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase">Puesto</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase">Salario Mensual</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-700 uppercase">Ventas</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase">Total Vendido</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-700 uppercase">Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topEmpleados.map((emp, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black">
                        {emp.nombre.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900">{emp.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${emp.puesto === 'Gerente' ? 'bg-purple-100 text-purple-700' :
                      emp.puesto === 'Farmacéutico' ? 'bg-blue-100 text-blue-700' :
                        emp.puesto === 'Cajero' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {emp.puesto}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">
                    S/ {parseFloat(emp.salario || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center font-black text-blue-600">
                    {emp.totalVentas}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-900">
                    S/ {parseFloat(emp.totalIngresos || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-gray-500 font-medium">
                      {emp.ultimaVenta ? `Última: ${new Date(emp.ultimaVenta).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : 'Sin actividad hoy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;