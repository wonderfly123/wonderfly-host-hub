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

// Music API calls
export const searchTracks = async (query) => {
  const res = await api.get(`/music/search?query=${query}`);
  return res.data;
};

export const getEventPlaylist = async (eventId) => {
  const res = await api.get(`/music/event/${eventId}/playlist`);
  return res.data;
};

export const updateEventPlaylist = async (eventId, playlistId) => {
  const res = await api.put(`/music/event/${eventId}/playlist`, { playlistId });
  return res.data;
};

export const getVotingQueue = async (eventId) => {
  const res = await api.get(`/music/event/${eventId}/queue`);
  return res.data;
};

export const addTrackToQueue = async (eventId, trackData) => {
  const res = await api.post(`/music/event/${eventId}/queue`, trackData);
  return res.data;
};

export const voteForTrack = async (eventId, trackId) => {
  const res = await api.post(`/music/event/${eventId}/queue/${trackId}/vote`);
  return res.data;
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
  const res = await api.post('/timeline', timelineItemData);
  return res.data;
};

export const getEventTimeline = async (eventId) => {
  try {
    console.log('API call: getEventTimeline for event:', eventId);
    console.log('Current auth headers:', api.defaults.headers.common['Authorization'] ? 'Token exists' : 'No token');
    
    // Try both versions of the endpoint
    let response;
    try {
      console.log('Trying endpoint: /timeline/event/' + eventId);
      response = await api.get(`/timeline/event/${eventId}`);
    } catch (firstError) {
      console.log('First endpoint failed:', firstError.message);
      console.log('Trying alternate endpoint: /timeline/' + eventId);
      response = await api.get(`/timeline/${eventId}`);
    }
    
    console.log('Timeline data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching timeline:', error.response?.data || error.message);
    throw error;
  }
};

export const updateTimelineItem = async (itemId, timelineItemData) => {
  const res = await api.put(`/timeline/${itemId}`, timelineItemData);
  return res.data;
};

export const deleteTimelineItem = async (itemId) => {
  const res = await api.delete(`/timeline/${itemId}`);
  return res.data;
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
  const res = await api.post('/notifications/announcement', announcementData);
  return res.data;
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
  searchTracks,
  getEventPlaylist,
  updateEventPlaylist,
  getVotingQueue,
  addTrackToQueue,
  voteForTrack,
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
  createAnnouncement
};

// Export as default
export default apiObject;