// server/routes/notification.routes.js
const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, notificationController.getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

// Create event announcement (admin only)
router.post('/announcement', authenticateToken, isAdmin, notificationController.createAnnouncement);

module.exports = router;