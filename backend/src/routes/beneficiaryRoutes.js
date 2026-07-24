// backend/src/routes/beneficiaryRoutes.js

const express = require('express');
const router = express.Router();

// Import the controllers for beneficiary operations
const {
  createBeneficiary,
  getBeneficiaries,
  getBeneficiaryById,
  updateBeneficiary,
  deleteBeneficiary,
} = require('../controllers/beneficiaryController');

// Import authentication middleware to protect all routes
const { protect, requireRole } = require('../middleware/authMiddleware');

const upload = require('../config/upload');

// Using router.route() lets us group endpoints that share the same URL path.
// This is a clean, production-ready organization pattern.

// Endpoints for "/api/beneficiaries"
router
  .route('/')
  .post(protect, requireRole(['ADMIN', 'STAFF']), upload.single('file'), createBeneficiary) // Create a new beneficiary (ADMIN/STAFF only)
  .get(protect, getBeneficiaries);  // List all beneficiaries with filter/search (All roles)

// Endpoints for "/api/beneficiaries/:id"
router
  .route('/:id')
  .get(protect, getBeneficiaryById)   // View single profile & history (All roles)
  .put(protect, requireRole(['ADMIN', 'STAFF']), updateBeneficiary)   // Edit profile details (ADMIN/STAFF only)
  .delete(protect, requireRole(['ADMIN']), deleteBeneficiary); // Delete beneficiary (ADMIN only)

module.exports = router;

