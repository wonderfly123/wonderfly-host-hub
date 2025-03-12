// server/services/spotify.service.js
const axios = require('axios');

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

  // Existing methods from previous implementation (searchTracks, etc.) remain the same
  // ...
}

module.exports = new SpotifyService();