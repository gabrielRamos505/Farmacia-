const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, salesController.getAll);
router.get('/summary', authMiddleware, salesController.getSummary);
router.get('/:id', authMiddleware, salesController.getById);
router.post('/', authMiddleware, salesController.create);

module.exports = router;
