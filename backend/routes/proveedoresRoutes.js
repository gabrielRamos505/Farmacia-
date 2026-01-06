const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, proveedoresController.getAll);
router.get('/:id', authMiddleware, proveedoresController.getById);
router.post('/', authMiddleware, proveedoresController.create);
router.put('/:id', authMiddleware, proveedoresController.update);
router.delete('/:id', authMiddleware, proveedoresController.delete);

module.exports = router;
