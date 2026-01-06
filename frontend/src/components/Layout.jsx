import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  Truck,
  Boxes
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hasPermission } from '../utils/permissions';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.isAdmin || false;
  const userRole = user?.puesto || '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Menú dinámico según el rol del usuario
  const allMenuItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['Gerente', 'Farmacéutico', 'Cajero', 'Almacenero', 'Auxiliar']
    },
    {
      path: '/inventory',
      icon: Package,
      label: 'Inventario',
      roles: ['Gerente', 'Farmacéutico', 'Almacenero', 'Auxiliar']
    },
    {
      path: '/stock',
      icon: Boxes,
      label: 'Lotes/Stock',
      roles: ['Gerente', 'Almacenero']
    },
    {
      path: '/suppliers',
      icon: Truck,
      label: 'Proveedores',
      roles: ['Gerente', 'Almacenero']
    },
    {
      path: '/pos',
      icon: ShoppingCart,
      label: 'Punto de Venta',
      roles: ['Gerente', 'Cajero']
    },
    {
      path: '/sales',
      icon: ShoppingCart,
      label: 'Ventas',
      roles: ['Gerente', 'Cajero', 'Farmacéutico'] // Farmacéutico puede ver historial pero no vender
    },
    {
      path: '/clientes',
      icon: UserIcon,
      label: 'Clientes',
      roles: ['Gerente', 'Cajero']
    },
    {
      path: '/analytics',
      icon: LayoutDashboard,
      label: 'Analíticas',
      roles: ['Gerente', 'Farmacéutico']
    },
    {
      path: '/users',
      icon: UsersIcon,
      label: 'Usuarios',
      roles: ['Gerente']
    }
  ];

  // Filtrar menú según el rol
  const menuItems = allMenuItems.filter(item => {
    // Si el usuario es admin, tiene acceso a todo
    if (isAdmin) return true;
    // Si no, verificar si su rol está permitido
    return item.roles.includes(userRole);
  });

  // Badge de rol con colores
  const getRoleBadge = () => {
    const badges = {
      'Gerente': { color: 'bg-purple-50 text-purple-600', label: 'GERENTE' },
      'Farmacéutico': { color: 'bg-blue-50 text-blue-600', label: 'FARMACÉUTICO' },
      'Cajero': { color: 'bg-green-50 text-green-600', label: 'CAJERO' },
      'Almacenero': { color: 'bg-amber-50 text-amber-600', label: 'ALMACENERO' },
      'Auxiliar': { color: 'bg-gray-50 text-gray-600', label: 'AUXILIAR' }
    };

    return badges[userRole] || { color: 'bg-gray-50 text-gray-600', label: userRole.toUpperCase() };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 shadow-sm z-30">
        <div className="p-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Package className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Farma<span className="text-blue-600">Admin</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative group"
              >
                <div className={`flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                  <item.icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                    />
                  )}
                  {!isActive && (
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              {user?.nombre?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.nombre || 'Usuario'}</p>
              <p className={`text-[10px] font-black uppercase tracking-wider ${roleBadge.color} px-2 py-0.5 rounded-md inline-block mt-1`}>
                {roleBadge.label}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 rounded-2xl hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
          <button
            className="lg:hidden p-2.5 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 max-w-xl mx-8 hidden sm:block">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar medicamentos, clientes..."
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center space-x-5">
            <button className="p-2.5 bg-gray-50 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 relative transition-all duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-8 bg-gray-100"></div>
            <div className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900">{user?.nombre} {user?.apellido}</p>
                <p className={`text-[10px] font-black uppercase tracking-wider ${roleBadge.color} px-2 py-0.5 rounded-md inline-block mt-0.5`}>
                  {roleBadge.label}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">
                {user?.nombre?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 flex items-center justify-between border-b border-gray-50">
                <h1 className="text-xl font-black text-gray-900">
                  Farma<span className="text-blue-600">Admin</span>
                </h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Info */}
              <div className="p-6 border-t border-gray-50">
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {user?.nombre?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{user?.nombre || 'Usuario'}</p>
                    <p className={`text-[10px] font-black uppercase tracking-wider ${roleBadge.color} px-2 py-0.5 rounded-md inline-block mt-1`}>
                      {roleBadge.label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 rounded-2xl hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
