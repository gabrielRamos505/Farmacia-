const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');

router.get('/', ventasController.getAllVentas);
router.post('/', ventasController.createVenta);
router.get('/search-productos', ventasController.searchProductos);
router.get('/search-clientes', ventasController.searchClientes);

module.exports = router;
