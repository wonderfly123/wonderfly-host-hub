// server/services/spotify.service.js
const axios = require('axios');

// Spotify API endpoints
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/api/token';

// Get Spotify access token
const getAccessToken = async () => {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }
    
    // Create the authorization string
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Make the request to get an access token
    const response = await axios({
      method: 'post',
      url: SPOTIFY_AUTH_URL,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error obtaining Spotify access token:', error.message);
    throw error;
  }
};

// Search for tracks
exports.searchTracks = async (query, limit = 10) => {
  try {
    const accessToken = await getAccessToken();
    
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
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      duration: track.duration_ms,
      imageUrl: track.album.images[0]?.url || null
    }));
  } catch (error) {
    console.error('Error searching Spotify tracks:', error.message);
    throw error;
  }
};

// Get playlist tracks
exports.getPlaylistTracks = async (playlistId) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'get',
      url: `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data.items.map(item => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map(artist => artist.name).join(', '),
      album: item.track.album.name,
      duration: item.track.duration_ms,
      imageUrl: item.track.album.images[0]?.url || null
    }));
  } catch (error) {
    console.error('Error getting playlist tracks:', error.message);
    throw error;
  }
};

// Get playlist details
exports.getPlaylist = async (playlistId) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios({
      method: 'get',
      url: `${SPOTIFY_API_URL}/playlists/${playlistId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.description,
      trackCount: response.data.tracks.total,
      imageUrl: response.data.images[0]?.url || null,
      owner: response.data.owner.display_name
    };
  } catch (error) {
    console.error('Error getting playlist details:', error.message);
    throw error;
  }
};