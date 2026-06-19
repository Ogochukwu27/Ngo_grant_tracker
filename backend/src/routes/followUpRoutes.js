// backend/src/routes/followUpRoutes.js

const express = require('express');
const router = express.Router();

// Import controllers
const {
  createFollowUp,
  getFollowUps,
  updateFollowUp,
  checkOverdueFollowUps,
  getNotifications,
  markNotificationAsRead,
} = require('../controllers/followUpController');

// Import authentication middleware
const { protect } = require('../middleware/authMiddleware');

// Mount routes

// Route patterns for /api/followups
router
  .route('/')
  .post(protect, createFollowUp)  // Schedule a follow-up (needs token)
  .get(protect, getFollowUps);    // Retrieve list of follow-ups (needs token)

// Scanner route to check for overdue follow-ups, update them, and email staff
// Route: POST /api/followups/check-overdue
router.post('/check-overdue', protect, checkOverdueFollowUps);

// Route patterns for In-App Notifications
// Route: GET /api/followups/notifications
router.get('/notifications', protect, getNotifications);

// Route: PUT /api/followups/notifications/:id/read
router.put('/notifications/:id/read', protect, markNotificationAsRead);

// Route pattern for specific follow-ups
// Route: PUT /api/followups/:id
router.route('/:id').put(protect, updateFollowUp); // Update notes/status (needs token)

module.exports = router;
