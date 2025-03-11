const express = require('express');
const eventController = require('../controllers/event.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Create a new event (admin only)
router.post('/', authenticateToken, isAdmin, eventController.createEvent);

// Get all events (admin only)
router.get('/', authenticateToken, isAdmin, eventController.getAllEvents);

// Get event by ID
router.get('/:eventId', authenticateToken, eventController.getEventById);

// Update event
router.put('/:eventId', authenticateToken, eventController.updateEvent);

// Delete event
router.delete('/:eventId', authenticateToken, eventController.deleteEvent);

module.exports = router;