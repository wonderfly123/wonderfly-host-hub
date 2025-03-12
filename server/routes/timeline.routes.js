// server/routes/timeline.routes.js
const express = require('express');
const timelineController = require('../controllers/timeline.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Enhanced debug middleware
const debugMiddleware = (req, res, next) => {
  console.log('Timeline route accessed:', req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Method:', req.method);
  console.log('Params:', req.params);
  
  // Save the original send method
  const originalSend = res.send;
  
  // Override the send method to log the response
  res.send = function(body) {
    console.log('Response body:', body.substring(0, 200) + '...'); // Log first 200 chars
    return originalSend.apply(this, arguments);
  };
  
  next();
};

// Create a timeline item (admin only)
router.post('/', authenticateToken, isAdmin, timelineController.createTimelineItem);

// Get event timeline - TEMPORARILY bypass authentication for debugging
router.get('/event/:eventId', debugMiddleware, timelineController.getEventTimeline);

// Alternative route - TEMPORARILY bypass authentication for debugging
router.get('/:eventId', debugMiddleware, timelineController.getEventTimeline);

// Update timeline item (admin only)
router.put('/:itemId', authenticateToken, isAdmin, timelineController.updateTimelineItem);

// Delete timeline item (admin only)
router.delete('/:itemId', authenticateToken, isAdmin, timelineController.deleteTimelineItem);

module.exports = router;