const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, productosController.getAll);
router.get('/categorias', authMiddleware, productosController.getCategorias);
router.get('/:id', authMiddleware, productosController.getById);
router.post('/', authMiddleware, productosController.create);
router.put('/:id', authMiddleware, productosController.update);
router.delete('/:id', authMiddleware, productosController.delete);

module.exports = router;
