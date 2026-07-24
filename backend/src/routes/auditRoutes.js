// backend/src/routes/auditRoutes.js

const express = require('express');
const router = express.Router();

// Import controller
const { getAuditLogs } = require('../controllers/auditController');

// Import auth and role middleware
const { protect, requireRole } = require('../middleware/authMiddleware');

// Mount routes
// Only users with active token AND ADMIN role can access audit log entries
router.get('/', protect, requireRole(['ADMIN']), getAuditLogs);

module.exports = router;
