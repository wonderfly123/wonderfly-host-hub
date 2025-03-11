// server/controllers/notification.controller.js
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.userId,
      read: false
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error retrieving notifications' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({ message: 'Server error updating notification' });
  }
};

// Create event announcement (admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { eventId, title, message, eventCode } = req.body;
    
    if (!eventId || !title || !message) {
      return res.status(400).json({ message: 'Event ID, title, and message are required' });
    }
    
    // Find all users for this event
    const users = await User.find({ eventCode });
    
    // Create a notification for each user
    const notifications = [];
    for (const user of users) {
      const notification = new Notification({
        user: user._id,
        event: eventId,
        title,
        message,
        type: 'info'
      });
      
      await notification.save();
      notifications.push(notification);
      
      // Send real-time notification
      req.app.get('io').to(`user-${user._id}`).emit('new-notification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type
      });
    }
    
    // Send to all users in the event
    req.app.get('io').to(`event-${eventId}`).emit('announcement', {
      title,
      message
    });
    
    res.status(201).json({
      message: 'Announcement sent successfully',
      notificationsCount: notifications.length
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error creating announcement' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.userId, read: false },
      { read: true }
    );
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    res.status(500).json({ message: 'Server error updating notifications' });
  }
};