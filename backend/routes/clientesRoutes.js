const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Rutas existentes
router.get('/', authMiddleware, clientesController.getAll);
router.get('/:id', authMiddleware, clientesController.getById);
router.post('/', authMiddleware, clientesController.create);
router.put('/:id', authMiddleware, clientesController.update);
router.delete('/:id', authMiddleware, clientesController.delete);

// ➕ NUEVAS RUTAS para punto de venta
router.get('/buscar-dni/:dni', authMiddleware, clientesController.buscarPorDNI);
router.post('/crear-rapido', authMiddleware, clientesController.crearRapido);

module.exports = router;
