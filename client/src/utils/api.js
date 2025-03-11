// client/src/utils/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Configure axios
axios.defaults.baseURL = API_URL;

// Add token to requests if available
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Event API calls
export const getEvents = async () => {
  const res = await axios.get('/events');
  return res.data;
};

export const getEventById = async (eventId) => {
  const res = await axios.get(`/events/${eventId}`);
  return res.data;
};

export const createEvent = async (eventData) => {
  const res = await axios.post('/events', eventData);
  return res.data;
};

export const updateEvent = async (eventId, eventData) => {
  const res = await axios.put(`/events/${eventId}`, eventData);
  return res.data;
};

export const deleteEvent = async (eventId) => {
  const res = await axios.delete(`/events/${eventId}`);
  return res.data;
};

// Menu API calls
export const getEventMenu = async (eventId) => {
  const res = await axios.get(`/menu/event/${eventId}`);
  return res.data;
};

export const createMenuItem = async (menuItemData) => {
  const res = await axios.post('/menu', menuItemData);
  return res.data;
};

export const updateMenuItem = async (menuItemId, menuItemData) => {
  const res = await axios.put(`/menu/${menuItemId}`, menuItemData);
  return res.data;
};

export const deleteMenuItem = async (menuItemId) => {
  const res = await axios.delete(`/menu/${menuItemId}`);
  return res.data;
};

// Order API calls
export const createOrder = async (orderData) => {
  const res = await axios.post('/orders', orderData);
  return res.data;
};

export const getUserOrders = async () => {
  const res = await axios.get('/orders/user');
  return res.data;
};

export const getOrderDetails = async (orderId) => {
  const res = await axios.get(`/orders/${orderId}`);
  return res.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await axios.put(`/orders/${orderId}/status`, { status });
  return res.data;
};

export const getEventOrders = async (eventId) => {
  const res = await axios.get(`/orders/event/${eventId}`);
  return res.data;
};

// Music API calls
export const searchTracks = async (query) => {
  const res = await axios.get(`/music/search?query=${query}`);
  return res.data;
};

export const getEventPlaylist = async (eventId) => {
  const res = await axios.get(`/music/event/${eventId}/playlist`);
  return res.data;
};

export const updateEventPlaylist = async (eventId, playlistId) => {
  const res = await axios.put(`/music/event/${eventId}/playlist`, { playlistId });
  return res.data;
};

export const getVotingQueue = async (eventId) => {
  const res = await axios.get(`/music/event/${eventId}/queue`);
  return res.data;
};

export const addTrackToQueue = async (eventId, trackData) => {
  const res = await axios.post(`/music/event/${eventId}/queue`, trackData);
  return res.data;
};

export const voteForTrack = async (eventId, trackId) => {
  const res = await axios.post(`/music/event/${eventId}/queue/${trackId}/vote`);
  return res.data;
};

// Poll API calls
export const createPoll = async (pollData) => {
  const res = await axios.post('/polls', pollData);
  return res.data;
};

export const getEventPolls = async (eventId) => {
  const res = await axios.get(`/polls/event/${eventId}`);
  return res.data;
};

export const votePoll = async (pollId, optionIndex) => {
  const res = await axios.post('/polls/vote', { pollId, optionIndex });
  return res.data;
};

export const closePoll = async (pollId) => {
  const res = await axios.put(`/polls/${pollId}/close`);
  return res.data;
};

// Timeline API calls
export const createTimelineItem = async (timelineItemData) => {
  const res = await axios.post('/timeline', timelineItemData);
  return res.data;
};

export const getEventTimeline = async (eventId) => {
  const res = await axios.get(`/timeline/event/${eventId}`);
  return res.data;
};

export const updateTimelineItem = async (itemId, timelineItemData) => {
  const res = await axios.put(`/timeline/${itemId}`, timelineItemData);
  return res.data;
};

export const deleteTimelineItem = async (itemId) => {
  const res = await axios.delete(`/timeline/${itemId}`);
  return res.data;
};

// Notification API calls
export const getUserNotifications = async () => {
  const res = await axios.get('/notifications');
  return res.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const res = await axios.put(`/notifications/${notificationId}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await axios.put('/notifications/read-all');
  return res.data;
};

export const createAnnouncement = async (announcementData) => {
  const res = await axios.post('/notifications/announcement', announcementData);
  return res.data;
};

// Export utility function directly for easier imports
export default {
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