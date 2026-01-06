import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    TrendingUp,
    Calendar,
    Download,
    Search,
    ArrowUpRight,
    User,
    Clock,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { salesService } from '../services/api';
import { hasPermission } from '../utils/permissions';
import { format } from 'date-fns';

const Sales = () => {
    const navigate = useNavigate();
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            setLoading(true);
            const response = await salesService.getAll();
            setSalesData(response.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Error al cargar ventas');
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = salesData.filter(sale =>
        sale.ID_Venta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.VEN_Numero_Boleta?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calcular totales
    const totalHoy = salesData
        .filter(s => {
            const fecha = new Date(s.VEN_Fecha_Hora);
            const hoy = new Date();
            return fecha.toDateString() === hoy.toDateString();
        })
        .reduce((sum, s) => sum + parseFloat(s.VEN_Total_Venta || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Ventas</h2>
                    <p className="text-gray-500 font-medium">Historial y reporte de transacciones.</p>
                </div>
                <div className="flex space-x-3">
                    {hasPermission('EXPORT_DATA') && (
                        <button className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                            <Download className="w-5 h-5" />
                            <span>Exportar CSV</span>
                        </button>
                    )}
                    {hasPermission('CREATE_SALE') && (
                        <button
                            onClick={() => navigate('/pos')}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span>Nueva Venta</span>
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-lg text-xs font-bold">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Hoy</span>
                        </span>
                    </div>
                    <p className="text-blue-100 font-medium text-sm">Ventas hoy</p>
                    <h3 className="text-2xl font-black mt-1">S/ {totalHoy.toFixed(2)}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <span className="text-gray-400 font-bold text-xs">Total</span>
                    </div>
                    <p className="text-gray-500 font-medium text-sm">Total de órdenes</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{salesData.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium text-sm">Última venta</p>
                    <h3 className="text-xl font-black text-gray-900 mt-1">
                        {salesData.length > 0 ? format(new Date(salesData[0].VEN_Fecha_Hora), 'HH:mm') : '--:--'}
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h4 className="text-lg font-black text-gray-900">Transacciones Recientes</h4>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar transacción..."
                            className="pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-sm min-w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/50">
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Orden ID</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Boleta</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Subtotal</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">IGV</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredSales.slice(0, 20).map((sale, index) => (
                                <motion.tr
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={sale.ID_Venta}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-6 py-5">
                                        <span className="font-bold text-blue-600">{sale.ID_Venta}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-gray-600">
                                            {sale.VEN_Numero_Boleta || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center text-gray-500 text-sm font-medium">
                                            <Clock className="w-4 h-4 mr-2" />
                                            {format(new Date(sale.VEN_Fecha_Hora), 'dd/MM/yyyy HH:mm')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-gray-700">S/ {parseFloat(sale.VEN_Subtotal).toFixed(2)}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm text-gray-500">S/ {parseFloat(sale.VEN_IGV).toFixed(2)}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-black text-gray-900">S/ {parseFloat(sale.VEN_Total_Venta).toFixed(2)}</p>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sales;
