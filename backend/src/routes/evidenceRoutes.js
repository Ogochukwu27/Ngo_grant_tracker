// backend/src/routes/evidenceRoutes.js

const express = require('express');
const router = express.Router();

// Import the upload middleware configuration (multer)
const upload = require('../config/upload');

// Import controllers
const {
  uploadEvidence,
  getEvidence,
  deleteEvidence,
} = require('../controllers/evidenceController');

// Import authentication middleware
const { protect } = require('../middleware/authMiddleware');

// Route mapping for /api/evidence
router
  .route('/')
  // 'upload.single("file")' parses a single file upload from a form field named "file".
  // It populates req.file with the file info and req.body with text fields (e.g. beneficiaryId).
  .post(protect, upload.single('file'), uploadEvidence) 
  .get(protect, getEvidence); // Get list of uploaded evidence

// Route mapping for /api/evidence/:id
router
  .route('/:id')
  .delete(protect, deleteEvidence); // Delete a file entry

module.exports = router;
