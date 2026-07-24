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
const { protect, requireRole } = require('../middleware/authMiddleware');

// Mount routes

// Route patterns for /api/followups
router
  .route('/')
  .post(protect, requireRole(['ADMIN', 'STAFF']), createFollowUp)  // Schedule a follow-up (ADMIN/STAFF only)
  .get(protect, getFollowUps);    // Retrieve list of follow-ups (All roles)

// Scanner route to check for overdue follow-ups, update them, and email staff
// Route: POST /api/followups/check-overdue (ADMIN/STAFF only)
router.post('/check-overdue', protect, requireRole(['ADMIN', 'STAFF']), checkOverdueFollowUps);

// Route patterns for In-App Notifications
// Route: GET /api/followups/notifications (All roles)
router.get('/notifications', protect, getNotifications);

// Route: PUT /api/followups/notifications/:id/read (All roles)
router.put('/notifications/:id/read', protect, markNotificationAsRead);

// Route pattern for specific follow-ups
// Route: PUT /api/followups/:id (ADMIN/STAFF only)
router.route('/:id').put(protect, requireRole(['ADMIN', 'STAFF']), updateFollowUp);

module.exports = router;
