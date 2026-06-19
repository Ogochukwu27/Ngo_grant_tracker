// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

// Import the controllers (the business logic)
const {
  registerUser,
  loginUser,
  getUserProfile,
  changePassword,
} = require('../controllers/authController');

// Import the authentication middleware (the bouncer)
const { protect } = require('../middleware/authMiddleware');

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

module.exports = router;
