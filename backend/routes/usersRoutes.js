const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

// Solo administradores pueden gestionar usuarios
router.get('/', authMiddleware, isAdmin, usersController.getAll);
router.get('/:id', authMiddleware, isAdmin, usersController.getById);
router.post('/', authMiddleware, isAdmin, usersController.create);
router.put('/:id', authMiddleware, isAdmin, usersController.update);
router.delete('/:id', authMiddleware, isAdmin, usersController.delete);

module.exports = router;
