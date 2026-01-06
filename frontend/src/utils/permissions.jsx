// Sistema de permisos por puesto
export const ROLES = {
    GERENTE: 'Gerente',
    FARMACEUTICO: 'Farmacéutico',
    ALMACENERO: 'Almacenero',
    CAJERO: 'Cajero',
    AUXILIAR: 'Auxiliar'
};

export const PERMISSIONS = {
    // Dashboard
    VIEW_FULL_DASHBOARD: ['Gerente', 'Farmacéutico'],
    VIEW_BASIC_DASHBOARD: ['Cajero', 'Almacenero', 'Auxiliar'],

    // Inventario
    VIEW_INVENTORY: ['Gerente', 'Farmacéutico', 'Almacenero', 'Auxiliar'],
    ADD_PRODUCT: ['Gerente'],
    EDIT_PRODUCT: ['Gerente'],
    DELETE_PRODUCT: ['Gerente'],
    UPDATE_STOCK: ['Gerente', 'Almacenero'],

    // Ventas (POS)
    VIEW_ALL_SALES: ['Gerente'],
    VIEW_OWN_SALES: ['Cajero'],
    CREATE_SALE: ['Gerente', 'Cajero'],
    EDIT_SALE: ['Gerente'],

    // Clientes
    VIEW_CLIENTS: ['Gerente', 'Cajero'],
    ADD_CLIENT: ['Gerente', 'Cajero'],

    // Usuarios
    VIEW_USERS: ['Gerente'],
    ADD_USER: ['Gerente'],
    EDIT_USER: ['Gerente'],
    DELETE_USER: ['Gerente'],

    // Precios
    VIEW_PRICES: ['Gerente', 'Farmacéutico', 'Cajero'],
    EDIT_PRICES: ['Gerente'],

    // Reportes
    VIEW_REPORTS: ['Gerente', 'Farmacéutico'],
    EXPORT_DATA: ['Gerente']
};

// Función para verificar si el usuario tiene permiso
export const hasPermission = (permission) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.puesto;

    if (!userRole) return false;

    const allowedRoles = PERMISSIONS[permission] || [];
    return allowedRoles.includes(userRole);
};

// Dashboard personalizado por rol
export const getDashboardConfig = (role) => {
    const configs = {
        'Gerente': {
            title: 'Panel de Gerencia',
            subtitle: 'Vista completa de la farmacia',
            showFullStats: true,
            showSalesChart: true,
            showDistribution: true,
            showUsers: false,
            showReports: true,
            statsCards: ['revenue', 'clients', 'products', 'pending'],
            canExport: true
        },
        'Farmacéutico': {
            title: 'Panel Farmacéutico',
            subtitle: 'Control de medicamentos y ventas',
            showFullStats: true,
            showSalesChart: true,
            showDistribution: true,
            showUsers: false,
            showReports: true,
            statsCards: ['revenue', 'products', 'prescriptions', 'alerts'],
            canExport: true
        },
        'Cajero': {
            title: 'Panel de Caja',
            subtitle: 'Tus ventas y rendimiento',
            showFullStats: false,
            showSalesChart: true,
            showDistribution: false,
            showUsers: false,
            showReports: false,
            showOnlyOwnSales: true,
            statsCards: ['todaySales', 'mySales', 'clients', 'pending'],
            canExport: false
        },
        'Almacenero': {
            title: 'Panel de Almacén',
            subtitle: 'Control de stock e inventario',
            showFullStats: false,
            showSalesChart: false,
            showDistribution: true,
            showUsers: false,
            showReports: false,
            showStockAlerts: true,
            statsCards: ['products', 'lowStock', 'incoming', 'expired'],
            canExport: false
        },
        'Auxiliar': {
            title: 'Panel Auxiliar',
            subtitle: 'Apoyo en inventario y ventas',
            showFullStats: false,
            showSalesChart: false,
            showDistribution: false,
            showUsers: false,
            showReports: false,
            statsCards: ['products', 'lowStock', 'todaySales'],
            canExport: false
        }
    };

    return configs[role] || configs['Cajero'];
};
