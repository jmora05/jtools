const express = require('express');
const router  = express.Router();
const {
    getDashboardStats,
    getVentasMensuales,
    getComprasMensuales,
    getVentasPeriodoGrafica,
    getProductoMasVendido,
    getProduccionResumen,
} = require('../controllers/dashboardController.js');

router.get('/stats',                  getDashboardStats);
router.get('/ventas-mensuales',       getVentasMensuales);
router.get('/compras-mensuales',      getComprasMensuales);
router.get('/ventas-periodo-grafica', getVentasPeriodoGrafica);
router.get('/producto-mas-vendido',   getProductoMasVendido);
router.get('/produccion-resumen',     getProduccionResumen);

module.exports = router;
