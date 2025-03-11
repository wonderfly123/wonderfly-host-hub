// server/routes/timeline.routes.js
const express = require('express');
const timelineController = require('../controllers/timeline.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Create a timeline item (admin only)
router.post('/', authenticateToken, isAdmin, timelineController.createTimelineItem);

// Get event timeline
router.get('/event/:eventId', authenticateToken, timelineController.getEventTimeline);

// Update timeline item (admin only)
router.put('/:itemId', authenticateToken, isAdmin, timelineController.updateTimelineItem);

// Delete timeline item (admin only)
router.delete('/:itemId', authenticateToken, isAdmin, timelineController.deleteTimelineItem);

module.exports = router;