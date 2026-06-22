const express = require('express');
const router = express.Router();
const { getChartData, getStats, getBarChart, getPieChart, getLineChart } = require('../controllers/dashboard');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

// Combined (existing — backward compat)
router.get('/dashboard/charts', isAuthenticatedUser, isAdmin, getChartData);

// Separate endpoints
router.get('/dashboard/stats', isAuthenticatedUser, isAdmin, getStats);
router.get('/dashboard/bar-chart', isAuthenticatedUser, isAdmin, getBarChart);
router.get('/dashboard/pie-chart', isAuthenticatedUser, isAdmin, getPieChart);
router.get('/dashboard/line-chart', isAuthenticatedUser, isAdmin, getLineChart);

module.exports = router;