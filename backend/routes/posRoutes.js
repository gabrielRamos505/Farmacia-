const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/productos-disponibles', authMiddleware, posController.getProductosDisponibles);
router.get('/search', authMiddleware, posController.searchProducts);
router.post('/sale', authMiddleware, posController.createSale);
router.get('/receipt/:ventaId', authMiddleware, posController.getReceipt);

module.exports = router;
