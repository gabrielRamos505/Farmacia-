import React from 'react';
import DashboardGerente from './DashboardGerente';
import DashboardFarmaceutico from './DashboardFarmaceutico';
import DashboardCajero from './DashboardCajero';
import DashboardAlmacenero from './DashboardAlmacenero';
import DashboardAuxiliar from './DashboardAuxiliar';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const getUserRole = () => {
        if (user.puesto) return user.puesto;
        if (user.isAdmin) return 'Gerente';
        return 'Cajero';
    };

    const userRole = getUserRole();

    // Renderizar el dashboard según el rol
    switch (userRole) {
        case 'Gerente':
            return <DashboardGerente />;
        case 'Farmacéutico':
            return <DashboardFarmaceutico />;
        case 'Cajero':
            return <DashboardCajero />;
        case 'Almacenero':
            return <DashboardAlmacenero />;
        case 'Auxiliar':
            return <DashboardAuxiliar />;
        default:
            return <DashboardGerente />;
    }
};

export default Dashboard;
