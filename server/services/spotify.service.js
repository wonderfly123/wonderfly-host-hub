// server/services/spotify.service.js
const axios = require('axios');

// Spotify API endpoints
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/api/token';

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  }

  // Generate authorization URL
  generateAuthorizationUrl(eventId) {
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming',
      'app-remote-control'
    ].join(' ');

    return `https://accounts.spotify.com/authorize?` +
      `client_id=${this.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${eventId}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        data: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri
        })
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        data: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get available playback devices
  async getAvailableDevices(accessToken) {
    try {
      const response = await axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/me/player/devices',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.devices;
    } catch (error) {
      console.error('Error fetching devices:', error.response?.data || error.message);
      throw error;
    }
  }

  // Add track to queue
  async addToQueue(accessToken, trackUri, deviceId) {
    try {
      await axios({
        method: 'post',
        url: 'https://api.spotify.com/v1/me/player/queue',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          uri: trackUri,
          device_id: deviceId
        }
      });
    } catch (error) {
      console.error('Add to queue error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get current playback
  async getCurrentPlayback(accessToken) {
    try {
      const response = await axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/me/player',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      // 204 No Content is returned when nothing is playing
      if (error.response && error.response.status === 204) {
        return null;
      }
      console.error('Get playback error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Search tracks
  async searchTracks(accessToken, query, limit = 10) {
    try {
      const response = await axios({
        method: 'get',
        url: `${SPOTIFY_API_URL}/search`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          q: query,
          type: 'track',
          limit
        }
      });

      return response.data.tracks.items.map(track => ({
        uri: track.uri,
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        imageUrl: track.album.images[0]?.url || null,
        duration: track.duration_ms
      }));
    } catch (error) {
      console.error('Track search error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user's playlists
  async getUserPlaylists(accessToken, limit = 20) {
    try {
      const response = await axios({
        method: 'get',
        url: `${SPOTIFY_API_URL}/me/playlists`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          limit
        }
      });

      return response.data.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        imageUrl: playlist.images[0]?.url || null,
        tracks: playlist.tracks.total
      }));
    } catch (error) {
      console.error('Error fetching user playlists:', error.response?.data || error.message);
      throw error;
    }
  }

  // Play a specific track or playlist
  async play(accessToken, deviceId, contextUri = null, trackUri = null) {
    try {
      await axios({
        method: 'put',
        url: `${SPOTIFY_API_URL}/me/player/play`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: { device_id: deviceId },
        data: {
          context_uri: contextUri,
          uris: trackUri ? [trackUri] : undefined
        }
      });
    } catch (error) {
      console.error('Playback control error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Pause playback
  async pause(accessToken, deviceId) {
    try {
      await axios({
        method: 'put',
        url: `${SPOTIFY_API_URL}/me/player/pause`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { device_id: deviceId }
      });
    } catch (error) {
      console.error('Pause playback error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Next track
  async next(accessToken, deviceId) {
    try {
      await axios({
        method: 'post',
        url: `${SPOTIFY_API_URL}/me/player/next`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { device_id: deviceId }
      });
    } catch (error) {
      console.error('Next track error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Previous track
  async previous(accessToken, deviceId) {
    try {
      await axios({
        method: 'post',
        url: `${SPOTIFY_API_URL}/me/player/previous`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: { device_id: deviceId }
      });
    } catch (error) {
      console.error('Previous track error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get playlist tracks
  async getPlaylistTracks(accessToken, playlistId, limit = 50) {
    try {
      const response = await axios({
        method: 'get',
        url: `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          limit
        }
      });

      return response.data.items.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => artist.name).join(', '),
        album: item.track.album.name,
        uri: item.track.uri,
        duration: item.track.duration_ms,
        imageUrl: item.track.album.images[0]?.url || null
      }));
    } catch (error) {
      console.error('Error fetching playlist tracks:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new SpotifyService();