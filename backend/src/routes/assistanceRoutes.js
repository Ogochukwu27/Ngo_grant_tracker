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
const { protect } = require('../middleware/authMiddleware');

// Route mapping for /api/assistance
router
  .route('/')
  .post(protect, createAssistance) // Log new support (needs token)
  .get(protect, getAssistanceRecords); // Fetch all logs (needs token)

// Route mapping for /api/assistance/:id
router
  .route('/:id')
  .put(protect, updateAssistance) // Update specific entry (needs token)
  .delete(protect, deleteAssistance); // Delete specific entry (needs token)

module.exports = router;
