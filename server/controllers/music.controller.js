// server/controllers/music.controller.js
const Event = require('../models/event.model');
const SpotifyService = require('../services/spotify.service');

// Generate Spotify Authorization URL
exports.generateSpotifyAuthUrl = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Generate authorization URL
    const authUrl = SpotifyService.generateAuthorizationUrl(eventId);
    
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Generate auth URL error:', error);
    res.status(500).json({ message: 'Failed to generate Spotify authorization URL' });
  }
};

// Spotify Callback Handler
exports.spotifyCallback = async (req, res) => {
  const { code, state: eventId } = req.query;
  
  if (!code || !eventId) {
    return res.status(400).json({ message: 'Missing authorization code or event ID' });
  }

  try {
    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } = await SpotifyService.exchangeCodeForTokens(code);
    
    // Get available devices to validate tokens
    const devices = await SpotifyService.getAvailableDevices(accessToken);
    
    // Find the event and update Spotify tokens
    const event = await Event.findByIdAndUpdate(eventId, {
      'spotify.isConnected': true,
      'spotify.accessToken': accessToken,
      'spotify.refreshToken': refreshToken,
      'spotify.tokenExpiresAt': new Date(Date.now() + expiresIn * 1000),
      'spotify.preferredDeviceId': devices[0]?.id,
      'spotify.connectedBy': req.userId
    }, { new: true });
    
    // Render a page that closes itself and sends message to opener
    res.send(`
      <html>
        <script>
          window.opener.postMessage({
            type: 'SPOTIFY_AUTH_SUCCESS',
            eventId: '${eventId}'
          }, '*');
          window.close();
        </script>
      </html>
    `);
  } catch (error) {
    console.error('Spotify callback error:', error);
    res.status(500).json({ message: 'Failed to complete Spotify authentication' });
  }
};

// Get Available Spotify Devices
exports.getSpotifyDevices = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Find event with current Spotify tokens
    const event = await Event.findById(eventId);
    
    // Check if Spotify is connected
    if (!event.spotify.isConnected) {
      return res.status(401).json({ message: 'Spotify not connected for this event' });
    }
    
    // Check and refresh token if needed
    let accessToken = event.spotify.accessToken;
    if (new Date() >= event.spotify.tokenExpiresAt) {
      try {
        accessToken = await SpotifyService.refreshAccessToken(event.spotify.refreshToken);
        
        // Update the access token in the database
        event.spotify.accessToken = accessToken;
        event.spotify.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
        await event.save();
      } catch (refreshError) {
        return res.status(401).json({ message: 'Failed to refresh Spotify token' });
      }
    }
    
    // Get available devices
    const devices = await SpotifyService.getAvailableDevices(accessToken);
    
    res.status(200).json({ devices });
  } catch (error) {
    console.error('Get Spotify devices error:', error);
    res.status(500).json({ message: 'Failed to fetch Spotify devices' });
  }
};

// Select Playback Device
exports.selectPlaybackDevice = async (req, res) => {
  try {
    const { eventId, deviceId } = req.body;
    
    // Find and update event with selected device
    await Event.findByIdAndUpdate(eventId, {
      'spotify.preferredDeviceId': deviceId
    });
    
    res.status(200).json({ message: 'Playback device selected successfully' });
  } catch (error) {
    console.error('Select playback device error:', error);
    res.status(500).json({ message: 'Failed to select playback device' });
  }
};

// Search Tracks
exports.searchTracks = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { query } = req.query;
    
    // Find event with current Spotify tokens
    const event = await Event.findById(eventId);
    
    // Check if Spotify is connected
    if (!event.spotify.isConnected) {
      return res.status(401).json({ message: 'Spotify not connected for this event' });
    }
    
    // Check and refresh token if needed
    let accessToken = event.spotify.accessToken;
    if (new Date() >= event.spotify.tokenExpiresAt) {
      try {
        accessToken = await SpotifyService.refreshAccessToken(event.spotify.refreshToken);
        
        // Update the access token in the database
        event.spotify.accessToken = accessToken;
        event.spotify.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
        await event.save();
      } catch (refreshError) {
        return res.status(401).json({ message: 'Failed to refresh Spotify token' });
      }
    }
    
    // Search tracks
    const tracks = await SpotifyService.searchTracks(accessToken, query);
    
    res.status(200).json({ tracks });
  } catch (error) {
    console.error('Search tracks error:', error);
    res.status(500).json({ message: 'Failed to search tracks' });
  }
};

// Add Track to Queue
exports.addTrackToQueue = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { trackUri, deviceId } = req.body;
    
    // Find event with current Spotify tokens
    const event = await Event.findById(eventId);
    
    // Check if Spotify is connected
    if (!event.spotify.isConnected) {
      return res.status(401).json({ message: 'Spotify not connected for this event' });
    }

    // Use provided deviceId or fall back to preferred device
    const activeDeviceId = deviceId || event.spotify.preferredDeviceId;
    
    // Check if we have a device to use
    if (!activeDeviceId) {
      return res.status(400).json({ message: 'No playback device available' });
    }
    
    // Check and refresh token if needed
    let accessToken = event.spotify.accessToken;
    if (new Date() >= event.spotify.tokenExpiresAt) {
      try {
        accessToken = await SpotifyService.refreshAccessToken(event.spotify.refreshToken);
        
        // Update the access token in the database
        event.spotify.accessToken = accessToken;
        event.spotify.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
        await event.save();
      } catch (refreshError) {
        return res.status(401).json({ message: 'Failed to refresh Spotify token' });
      }
    }
    
    // Add track to queue
    await SpotifyService.addToQueue(
      accessToken, 
      trackUri, 
      activeDeviceId
    );
    
    // If using a provided deviceId that's different from the stored one, update the event
    if (deviceId && deviceId !== event.spotify.preferredDeviceId) {
      event.spotify.preferredDeviceId = deviceId;
      await event.save();
    }
    
    res.status(200).json({ message: 'Track added to queue successfully' });
  } catch (error) {
    console.error('Add track to queue error:', error);
    res.status(500).json({ message: 'Failed to add track to queue' });
  }
};

// Get Current Playback
exports.getCurrentPlayback = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Find event with current Spotify tokens
    const event = await Event.findById(eventId);
    
    // Check if Spotify is connected
    if (!event.spotify.isConnected) {
      return res.status(401).json({ message: 'Spotify not connected for this event' });
    }
    
    // Check and refresh token if needed
    let accessToken = event.spotify.accessToken;
    if (new Date() >= event.spotify.tokenExpiresAt) {
      try {
        accessToken = await SpotifyService.refreshAccessToken(event.spotify.refreshToken);
        
        // Update the access token in the database
        event.spotify.accessToken = accessToken;
        event.spotify.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
        await event.save();
      } catch (refreshError) {
        return res.status(401).json({ message: 'Failed to refresh Spotify token' });
      }
    }
    
    // Get current playback
    const playbackState = await SpotifyService.getCurrentPlayback(accessToken);
    
    res.status(200).json({ playbackState });
  } catch (error) {
    console.error('Get current playback error:', error);
    res.status(500).json({ message: 'Failed to get current playback' });
  }
};

// Get User's Playlists
exports.getUserPlaylists = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Find event with current Spotify tokens
    const event = await Event.findById(eventId);
    
    // Check if Spotify is connected
    if (!event.spotify.isConnected) {
      return res.status(401).json({ message: 'Spotify not connected for this event' });
    }
    
    // Check and refresh token if needed
    let accessToken = event.spotify.accessToken;
    if (new Date() >= event.spotify.tokenExpiresAt) {
      try {
        accessToken = await SpotifyService.refreshAccessToken(event.spotify.refreshToken);
        
        // Update the access token in the database
        event.spotify.accessToken = accessToken;
        event.spotify.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
        await event.save();
      } catch (refreshError) {
        return res.status(401).json({ message: 'Failed to refresh Spotify token' });
      }
    }
    
    // Get user's playlists
    const playlists = await SpotifyService.getUserPlaylists(accessToken);
    
    res.status(200).json({ playlists });
  } catch (error) {
    console.error('Get user playlists error:', error);
    res.status(500).json({ message: 'Failed to fetch user playlists' });
  }
};

// Get Playlist Tracks
exports.getPlaylistTracks = async (req, res) => {
  try {
    const { eventId, playlistId } = req.params;
    
    // Find event with current Spotify tokens
    const event = await Event.findById(eventId);
    
    // Check if Spotify is connected
    if (!event.spotify.isConnected) {
      return res.status(401).json({ message: 'Spotify not connected for this event' });
    }
    
    // Check and refresh token if needed
    let accessToken = event.spotify.accessToken;
    if (new Date() >= event.spotify.tokenExpiresAt) {
      try {
        accessToken = await SpotifyService.refreshAccessToken(event.spotify.refreshToken);
        
        // Update the access token in the database
        event.spotify.accessToken = accessToken;
        event.spotify.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
        await event.save();
      } catch (refreshError) {
        return res.status(401).json({ message: 'Failed to refresh Spotify token' });
      }
    }
    
    // Get playlist tracks
    const tracks = await SpotifyService.getPlaylistTracks(accessToken, playlistId);
    
    res.status(200).json({ tracks });
  } catch (error) {
    console.error('Get playlist tracks error:', error);
    res.status(500).json({ message: 'Failed to fetch playlist tracks' });
  }
};

// Playback Control - Updated to accept deviceId parameter
exports.playbackControl = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { action, contextUri, trackUri, deviceId } = req.body;
    
    // Find event with current Spotify tokens
    const event = await Event.findById(eventId);
    
    // Check if Spotify is connected
    if (!event.spotify.isConnected) {
      return res.status(401).json({ message: 'Spotify not connected for this event' });
    }

    // Use provided deviceId or fall back to preferred device from event
    const activeDeviceId = deviceId || event.spotify.preferredDeviceId;
    
    // Check if we have a device to use
    if (!activeDeviceId) {
      return res.status(400).json({ message: 'No playback device available' });
    }
    
    // Check and refresh token if needed
    let accessToken = event.spotify.accessToken;
    if (new Date() >= event.spotify.tokenExpiresAt) {
      try {
        accessToken = await SpotifyService.refreshAccessToken(event.spotify.refreshToken);
        
        // Update the access token in the database
        event.spotify.accessToken = accessToken;
        event.spotify.tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
        await event.save();
      } catch (refreshError) {
        return res.status(401).json({ message: 'Failed to refresh Spotify token' });
      }
    }
    
    // Perform playback action
    switch(action) {
      case 'play':
        await SpotifyService.play(
          accessToken, 
          activeDeviceId, 
          contextUri, 
          trackUri
        );
        break;
      case 'pause':
        await SpotifyService.pause(
          accessToken, 
          activeDeviceId
        );
        break;
      case 'next':
        await SpotifyService.next(
          accessToken, 
          activeDeviceId
        );
        break;
      case 'previous':
        await SpotifyService.previous(
          accessToken, 
          activeDeviceId
        );
        break;
      default:
        return res.status(400).json({ message: 'Invalid playback action' });
    }
    
    // If using a provided deviceId that's different from the stored one, update the event
    if (deviceId && deviceId !== event.spotify.preferredDeviceId) {
      event.spotify.preferredDeviceId = deviceId;
      await event.save();
    }
    
    res.status(200).json({ message: 'Playback action completed successfully' });
  } catch (error) {
    console.error('Playback control error:', error);
    res.status(500).json({ message: 'Failed to perform playback action' });
  }
};