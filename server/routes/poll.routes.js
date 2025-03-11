// server/routes/poll.routes.js
const express = require('express');
const pollController = require('../controllers/poll.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Create a new poll (admin only)
router.post('/', authenticateToken, isAdmin, pollController.createPoll);

// Get active polls for an event
router.get('/event/:eventId', authenticateToken, pollController.getEventPolls);

// Vote on a poll
router.post('/vote', authenticateToken, pollController.votePoll);

// Close a poll (admin only)
router.put('/:pollId/close', authenticateToken, isAdmin, pollController.closePoll);

module.exports = router;