// client/src/utils/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

// Configure axios with a base instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Add request interceptor to include token with every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - log error but don't automatically redirect
      console.error('Authentication error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Event API calls
export const getEvents = async () => {
  try {
    const res = await api.get('/events');
    return res.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const getEventById = async (eventId) => {
  try {
    const res = await api.get(`/events/${eventId}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  const res = await api.post('/events', eventData);
  return res.data;
};

export const updateEvent = async (eventId, eventData) => {
  const res = await api.put(`/events/${eventId}`, eventData);
  return res.data;
};

export const deleteEvent = async (eventId) => {
  const res = await api.delete(`/events/${eventId}`);
  return res.data;
};

// Menu API calls
export const getEventMenu = async (eventId) => {
  const res = await api.get(`/menu/event/${eventId}`);
  return res.data;
};

export const createMenuItem = async (menuItemData) => {
  const res = await api.post('/menu', menuItemData);
  return res.data;
};

export const updateMenuItem = async (menuItemId, menuItemData) => {
  const res = await api.put(`/menu/${menuItemId}`, menuItemData);
  return res.data;
};

export const deleteMenuItem = async (menuItemId) => {
  const res = await api.delete(`/menu/${menuItemId}`);
  return res.data;
};

// Order API calls
export const createOrder = async (orderData) => {
  const res = await api.post('/orders', orderData);
  return res.data;
};

export const getUserOrders = async () => {
  const res = await api.get('/orders/user');
  return res.data;
};

export const getOrderDetails = async (orderId) => {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await api.put(`/orders/${orderId}/status`, { status });
  return res.data;
};

export const getEventOrders = async (eventId) => {
  const res = await api.get(`/orders/event/${eventId}`);
  return res.data;
};

// Spotify/Music API calls
export const generateSpotifyAuthUrl = async (eventId) => {
  try {
    const response = await api.get(`/music/${eventId}/spotify-auth-url`);
    return response.data.authUrl;
  } catch (error) {
    console.error('Error generating Spotify auth URL:', error);
    throw error;
  }
};

export const getSpotifyDevices = async (eventId) => {
  try {
    const response = await api.get(`/music/${eventId}/devices`);
    return response.data.devices;
  } catch (error) {
    console.error('Error fetching Spotify devices:', error);
    throw error;
  }
};

export const selectPlaybackDevice = async (eventId, deviceId) => {
  try {
    const response = await api.post(`/music/device`, { eventId, deviceId });
    return response.data;
  } catch (error) {
    console.error('Error selecting playback device:', error);
    throw error;
  }
};

export const searchTracks = async (eventId, query) => {
  try {
    const response = await api.get(`/music/${eventId}/search`, { 
      params: { query } 
    });
    return response.data.tracks;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

export const addTrackToQueue = async (eventId, trackUri, deviceId = null) => {
  try {
    const response = await api.post(`/music/${eventId}/queue`, { 
      trackUri,
      deviceId 
    });
    return response.data;
  } catch (error) {
    console.error('Error adding track to queue:', error);
    throw error;
  }
};

export const getCurrentPlayback = async (eventId) => {
  try {
    const response = await api.get(`/music/${eventId}/playback`);
    return response.data.playbackState;
  } catch (error) {
    console.error('Error getting current playback:', error);
    throw error;
  }
};

export const getVotingQueue = async (eventId) => {
  try {
    const response = await api.get(`/music/event/${eventId}/queue`);
    return response.data;
  } catch (error) {
    console.error('Error getting voting queue:', error);
    throw error;
  }
};

export const voteForTrack = async (eventId, trackId) => {
  try {
    const response = await api.post(`/music/event/${eventId}/queue/${trackId}/vote`);
    return response.data;
  } catch (error) {
    console.error('Error voting for track:', error);
    throw error;
  }
};

// Get User's Playlists
export const getUserPlaylists = async (eventId) => {
  try {
    const response = await api.get(`/music/${eventId}/playlists`);
    return response.data.playlists;
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    throw error;
  }
};

// Get Playlist Tracks
export const getPlaylistTracks = async (eventId, playlistId) => {
  try {
    const response = await api.get(`/music/${eventId}/playlists/${playlistId}/tracks`);
    return response.data.tracks;
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    throw error;
  }
};

// Updated playbackControl to include deviceId
export const playbackControl = async (eventId, action, contextUri = null, trackUri = null, deviceId = null) => {
  try {
    const response = await api.post(`/music/${eventId}/playback/control`, {
      action,
      contextUri,
      trackUri,
      deviceId
    });
    return response.data;
  } catch (error) {
    console.error('Error controlling playback:', error);
    throw error;
  }
};

// Poll API calls
export const createPoll = async (pollData) => {
  const res = await api.post('/polls', pollData);
  return res.data;
};

export const getEventPolls = async (eventId) => {
  const res = await api.get(`/polls/event/${eventId}`);
  return res.data;
};

export const votePoll = async (pollId, optionIndex) => {
  const res = await api.post('/polls/vote', { pollId, optionIndex });
  return res.data;
};

export const closePoll = async (pollId) => {
  const res = await api.put(`/polls/${pollId}/close`);
  return res.data;
};

// Timeline API calls
export const createTimelineItem = async (timelineItemData) => {
  try {
    const formattedData = {
      ...timelineItemData,
      startTime: timelineItemData.startTime instanceof Date 
        ? timelineItemData.startTime.toISOString() 
        : timelineItemData.startTime,
      endTime: timelineItemData.endTime instanceof Date 
        ? timelineItemData.endTime.toISOString() 
        : timelineItemData.endTime
    };
    
    const res = await api.post('/timeline', formattedData);
    return res.data;
  } catch (error) {
    console.error('Error creating timeline item:', error);
    throw error;
  }
};

export const getEventTimeline = async (eventId) => {
  try {
    const response = await api.get(`/timeline/event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching timeline:', error);
    throw error;
  }
};

export const updateTimelineItem = async (itemId, timelineItemData) => {
  try {
    const formattedData = {
      ...timelineItemData,
      startTime: timelineItemData.startTime instanceof Date 
        ? timelineItemData.startTime.toISOString() 
        : timelineItemData.startTime,
      endTime: timelineItemData.endTime instanceof Date 
        ? timelineItemData.endTime.toISOString() 
        : timelineItemData.endTime
    };
    
    const res = await api.put(`/timeline/${itemId}`, formattedData);
    return res.data;
  } catch (error) {
    console.error('Error updating timeline item:', error);
    throw error;
  }
};

export const deleteTimelineItem = async (itemId) => {
  try {
    const res = await api.delete(`/timeline/${itemId}`);
    return res.data;
  } catch (error) {
    console.error('Error deleting timeline item:', error);
    throw error;
  }
};

// Payment API calls
export const getSquareAppInfo = async () => {
  try {
    const response = await api.get('/payments/square-info');
    return response.data;
  } catch (error) {
    console.error('Error fetching Square app info:', error);
    throw error;
  }
};

export const processPayment = async (orderId, sourceId) => {
  try {
    const response = await api.post('/payments/process', { orderId, sourceId });
    return response.data;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

export const getPaymentStatus = async (orderId) => {
  try {
    const response = await api.get(`/payments/${orderId}/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
};

// Notification API calls
export const getUserNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const res = await api.put(`/notifications/${notificationId}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.put('/notifications/read-all');
  return res.data;
};

export const createAnnouncement = async (announcementData) => {
  try {
    const res = await api.post('/notifications/announcement', announcementData);
    return res.data;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

// Create API object
const apiObject = {
  setAuthToken,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createOrder,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus,
  getEventOrders,
  generateSpotifyAuthUrl,
  getSpotifyDevices,
  selectPlaybackDevice,
  searchTracks,
  addTrackToQueue,
  getCurrentPlayback,
  getVotingQueue,
  voteForTrack,
  getUserPlaylists,
  getPlaylistTracks,
  playbackControl,
  createPoll,
  getEventPolls,
  votePoll,
  closePoll,
  createTimelineItem,
  getEventTimeline,
  updateTimelineItem,
  deleteTimelineItem,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createAnnouncement,
  getSquareAppInfo,
  processPayment,
  getPaymentStatus
};

// Export as default
export default apiObject;