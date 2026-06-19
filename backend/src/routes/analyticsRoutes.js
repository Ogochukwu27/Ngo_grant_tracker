// backend/src/routes/analyticsRoutes.js

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getDashboardStats,
  getSpendingByCategory,
  getSpendingByMonth,
  purgeTestData,
} = require('../controllers/analyticsController');

// Import authentication middleware
const { protect } = require('../middleware/authMiddleware');

// Define API paths and map them to their controllers

// Route: GET /api/analytics/stats
// Retrieves dashboard summary metrics (total beneficiaries, total disburse, case counters).
router.get('/stats', protect, getDashboardStats);

// Route: GET /api/analytics/spending-by-category
// Retrieves financial totals grouped by category (for pie charts).
router.get('/spending-by-category', protect, getSpendingByCategory);

// Route: GET /api/analytics/spending-by-month
// Retrieves spending totals grouped chronologically by month (for trend line charts).
router.get('/spending-by-month', protect, getSpendingByMonth);

// Route: POST /api/analytics/purge-test-data
// Deletes all temporary/demo beneficiary records and associated ledger items.
router.post('/purge-test-data', protect, purgeTestData);

module.exports = router;
