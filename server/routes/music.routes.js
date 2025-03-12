// server/routes/music.routes.js
const express = require('express');
const musicController = require('../controllers/music.controller');
const { authenticateToken, isAdmin, eventParticipantCheck } = require('../middlewares/auth.middleware');

const router = express.Router();

// Generate Spotify Authorization URL (admin only)
router.get('/:eventId/spotify-auth-url', authenticateToken, isAdmin, musicController.generateSpotifyAuthUrl);

// Spotify Callback Route (public route)
router.get('/spotify/callback', musicController.spotifyCallback);

// Get Available Spotify Devices (event participants)
router.get('/:eventId/devices', authenticateToken, eventParticipantCheck, musicController.getSpotifyDevices);

// Select Playback Device (admin only)
router.post('/device', authenticateToken, isAdmin, musicController.selectPlaybackDevice);

// Search Tracks (event participants)
router.get('/:eventId/search', authenticateToken, eventParticipantCheck, musicController.searchTracks);

// Add Track to Queue (event participants)
router.post('/:eventId/queue', authenticateToken, eventParticipantCheck, musicController.addTrackToQueue);

// Get Current Playback (event participants)
router.get('/:eventId/playback', authenticateToken, eventParticipantCheck, musicController.getCurrentPlayback);

module.exports = router;