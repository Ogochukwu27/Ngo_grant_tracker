// backend/src/routes/assistanceRoutes.js

const express = require('express');
const router = express.Router();

// Import controllers
const {
  createAssistance,
  getAssistanceRecords,
  updateAssistance,
  deleteAssistance,
} = require('../controllers/assistanceController');

// Import authentication middleware
const { protect, requireRole } = require('../middleware/authMiddleware');

// Route mapping for /api/assistance
router
  .route('/')
  .post(protect, requireRole(['ADMIN', 'STAFF']), createAssistance) // Log new support (ADMIN/STAFF only)
  .get(protect, getAssistanceRecords); // Fetch all logs (All roles)

// Route mapping for /api/assistance/:id
router
  .route('/:id')
  .put(protect, requireRole(['ADMIN', 'STAFF']), updateAssistance) // Update specific entry (ADMIN/STAFF only)
  .delete(protect, requireRole(['ADMIN']), deleteAssistance); // Delete specific entry (ADMIN only)

module.exports = router;
