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
const { protect } = require('../middleware/authMiddleware');

// Using router.route() lets us group endpoints that share the same URL path.
// This is a clean, production-ready organization pattern.

// Endpoints for "/api/beneficiaries"
router
  .route('/')
  .post(protect, createBeneficiary) // Create a new beneficiary (needs token)
  .get(protect, getBeneficiaries);  // List all beneficiaries with filter/search (needs token)

// Endpoints for "/api/beneficiaries/:id"
router
  .route('/:id')
  .get(protect, getBeneficiaryById)   // View single profile & history (needs token)
  .put(protect, updateBeneficiary)   // Edit profile details (needs token)
  .delete(protect, deleteBeneficiary); // Delete beneficiary (needs token)

module.exports = router;
