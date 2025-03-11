// server/routes/music.routes.js
const express = require('express');
const musicController = require('../controllers/music.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Search for tracks
router.get('/search', authenticateToken, musicController.searchTracks);

// Get playlist tracks for an event
router.get('/event/:eventId/playlist', authenticateToken, musicController.getEventPlaylist);

// Update event playlist
router.put('/event/:eventId/playlist', authenticateToken, musicController.updateEventPlaylist);

// Get voting queue for an event
router.get('/event/:eventId/queue', authenticateToken, musicController.getVotingQueue);

// Add track to voting queue
router.post('/event/:eventId/queue', authenticateToken, musicController.addTrackToQueue);

// Vote for a track
router.post('/event/:eventId/queue/:trackId/vote', authenticateToken, musicController.voteForTrack);

module.exports = router;