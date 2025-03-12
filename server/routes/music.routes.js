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

// Select Playback Device (event participants)
router.post('/device', authenticateToken, eventParticipantCheck, musicController.selectPlaybackDevice);

// Search Tracks (event participants)
router.get('/:eventId/search', authenticateToken, eventParticipantCheck, musicController.searchTracks);

// Add Track to Queue (event participants)
router.post('/:eventId/queue', authenticateToken, eventParticipantCheck, musicController.addTrackToQueue);

// Get Current Playback (event participants)
router.get('/:eventId/playback', authenticateToken, eventParticipantCheck, musicController.getCurrentPlayback);

// Get User's Playlists (event participants)
router.get('/:eventId/playlists', authenticateToken, eventParticipantCheck, musicController.getUserPlaylists);

// Get Playlist Tracks (event participants)
router.get('/:eventId/playlists/:playlistId/tracks', authenticateToken, eventParticipantCheck, musicController.getPlaylistTracks);

// Playback Control (event participants)
router.post('/:eventId/playback/control', authenticateToken, eventParticipantCheck, musicController.playbackControl);

module.exports = router;