const express = require('express');
const router  = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController.js');

// GET /api/dashboard/stats — métricas completas del dashboard
router.get('/stats', getDashboardStats);

module.exports = router;
