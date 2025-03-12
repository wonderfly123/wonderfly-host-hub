// server/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Event = require('../models/event.model');

// Verify JWT token
exports.authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Log the decoded token
    
    // Check for either id or userId in the decoded token
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token, user not found' });
    }

    // Add user ID to request
    req.userId = userId;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Check if user can access an event (admin or participant)
exports.eventParticipantCheck = async (req, res, next) => {
  try {
    // If user is admin, allow access
    if (req.userRole === 'admin') {
      return next();
    }
    
    const { eventId } = req.params;
    console.log('Checking event access for user:', req.userId, 'event:', eventId);
    
    // Find the user with more details
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user has the event code
    console.log('User event code:', user.eventCode, 'Event access code:', event.accessCode);
    if (user.eventCode === event.accessCode) {
      return next();
    }
    
    // Check if user is in the event participants (if you have such a field)
    if (user.eventsParticipating && user.eventsParticipating.includes(eventId)) {
      return next();
    }
    
    console.log('User denied access to event');
    return res.status(403).json({ message: 'Access denied to this event' });
  } catch (error) {
    console.error('Event access check error:', error);
    return res.status(500).json({ message: 'Server error checking event access' });
  }
};