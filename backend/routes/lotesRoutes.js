const express = require('express');
const router = express.Router();
const lotesController = require('../controllers/lotesController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Todas las rutas de lotes requieren estar logueado
router.get('/', authMiddleware, lotesController.getAll);
router.get('/producto/:productoId', authMiddleware, lotesController.getByProducto);
router.get('/proximos-vencer', authMiddleware, lotesController.getProximosVencer);
router.post('/', authMiddleware, lotesController.create);
router.put('/:id', authMiddleware, lotesController.update);

module.exports = router;
