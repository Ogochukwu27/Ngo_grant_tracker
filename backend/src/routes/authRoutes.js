// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

// Import the controllers (the business logic)
const {
  registerUser,
  loginUser,
  getUserProfile,
  changePassword,
  getUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require('../controllers/authController');

// Import the authentication middleware (the bouncer)
const { protect, requireRole } = require('../middleware/authMiddleware');

// Define API paths and map them to their controllers

// Route: POST /api/auth/register
// Registers a new user. Access: Public
router.post('/register', registerUser);

// Route: POST /api/auth/login
// Logins a user and issues a JWT token. Access: Public
router.post('/login', loginUser);

// Route: GET /api/auth/profile
// Fetches the logged in user's profile.
// Access: Private (we insert 'protect' middleware to verify the token before hitting the controller)
router.get('/profile', protect, getUserProfile);

// Route: PUT /api/auth/change-password
// Updates the logged in user's password.
// Access: Private (Requires JWT token)
router.put('/change-password', protect, changePassword);

// User Management Routes (Admin only)
// All endpoints under here require both a valid token and the ADMIN role.
router.get('/users', protect, requireRole(['ADMIN']), getUsers);
router.put('/users/:id/role', protect, requireRole(['ADMIN']), updateUserRole);
router.put('/users/:id/status', protect, requireRole(['ADMIN']), updateUserStatus);
router.delete('/users/:id', protect, requireRole(['ADMIN']), deleteUser);

module.exports = router;

