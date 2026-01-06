const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ==========================================
// RUTAS BÁSICAS
// ==========================================
router.get('/stats', authMiddleware, dashboardController.getStats);
router.get('/ventas-semana', authMiddleware, dashboardController.getVentasSemana);
router.get('/top-productos', authMiddleware, dashboardController.getTopProductos);
router.get('/metodos-pago', authMiddleware, dashboardController.getMetodosPago);
router.get('/ultimas-ventas', authMiddleware, dashboardController.getUltimasVentas);
router.get('/alertas', authMiddleware, dashboardController.getAlertas);
router.get('/distribucion-laboratorio', authMiddleware, dashboardController.getDistribucionLaboratorio);
router.get('/tendencias', authMiddleware, dashboardController.getTendencias);

// ==========================================
// ANÁLISIS AVANZADO: EMPLEADOS
// ==========================================
router.get('/top-empleados', authMiddleware, dashboardController.getTopEmpleados);
router.get('/rendimiento-empleado/:empleadoId', authMiddleware, dashboardController.getRendimientoEmpleado);

// ==========================================
// ANÁLISIS AVANZADO: PRODUCTOS
// ==========================================
router.get('/ranking-productos', authMiddleware, dashboardController.getRankingProductos);
router.get('/rotacion-productos', authMiddleware, dashboardController.getRotacionProductos);

// ==========================================
// ANÁLISIS AVANZADO: CLIENTES
// ==========================================
router.get('/clientes-frecuentes', authMiddleware, dashboardController.getClientesFrecuentes);
router.get('/clientes-vip', authMiddleware, dashboardController.getClientesVIP);

// ==========================================
// ANÁLISIS DE HORARIOS Y TENDENCIAS
// ==========================================
router.get('/ventas-por-hora', authMiddleware, dashboardController.getVentasPorHora);
router.get('/ventas-por-dia-semana', authMiddleware, dashboardController.getVentasPorDiaSemana);

// ==========================================
// COMPARATIVAS Y TENDENCIAS
// ==========================================
router.get('/comparativa-mensual', authMiddleware, dashboardController.getComparativaMensual);

// ==========================================
// DASHBOARD COMPLETO AVANZADO
// ==========================================
router.get('/avanzado', authMiddleware, dashboardController.getDashboardAvanzado);

module.exports = router;
