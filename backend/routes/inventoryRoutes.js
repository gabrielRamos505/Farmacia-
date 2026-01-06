const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Todas las rutas protegidas
router.get('/', authMiddleware, inventoryController.getAll);
router.get('/low-stock', authMiddleware, inventoryController.getLowStock);
router.get('/:id', authMiddleware, inventoryController.getById);
router.post('/', authMiddleware, inventoryController.create);
router.put('/:id', authMiddleware, inventoryController.update);

module.exports = router;
