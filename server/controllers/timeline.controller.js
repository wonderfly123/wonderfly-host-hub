// server/controllers/timeline.controller.js
const TimelineItem = require('../models/timelineItem.model');
const Event = require('../models/event.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

// Create a timeline item (admin only)
exports.createTimelineItem = async (req, res) => {
  try {
    const { 
      eventId, 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      type, 
      important 
    } = req.body;
    
    // Validate inputs
    if (!eventId || !title || !startTime) {
      return res.status(400).json({ message: 'Event ID, title, and start time are required' });
    }
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Create timeline item
    const timelineItem = new TimelineItem({
      event: eventId,
      title,
      description,
      startTime,
      endTime,
      location,
      type: type || 'activity',
      important: important || false,
      createdBy: req.userId
    });
    
    await timelineItem.save();
    
    // If marked as important, create notifications for all event users
    if (important) {
      const users = await User.find({ eventCode: event.accessCode });
      
      for (const user of users) {
        const notification = new Notification({
          user: user._id,
          event: eventId,
          title: 'New Important Event Added',
          message: `"${title}" has been added to the schedule at ${new Date(startTime).toLocaleTimeString()}`,
          type: 'info'
        });
        
        await notification.save();
        
        // Send real-time notification
        req.app.get('io').to(`user-${user._id}`).emit('new-notification', {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type
        });
      }
    }
    
    // Notify all users in the event about timeline update
    req.app.get('io').to(`event-${eventId}`).emit('timeline-updated');
    
    res.status(201).json({
      message: 'Timeline item created successfully',
      timelineItem: {
        id: timelineItem._id,
        title: timelineItem.title,
        startTime: timelineItem.startTime
      }
    });
  } catch (error) {
    console.error('Create timeline item error:', error);
    res.status(500).json({ message: 'Server error creating timeline item' });
  }
};

// Get event timeline
exports.getEventTimeline = async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('Getting timeline for event:', eventId, 'User:', req.userId);
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('Event not found for timeline request:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get timeline items
    const timelineItems = await TimelineItem.find({ event: eventId })
      .sort({ startTime: 1 });
    
    console.log(`Found ${timelineItems.length} timeline items for event ${eventId}`);
    res.status(200).json({ timelineItems });
  } catch (error) {
    console.error('Get event timeline error:', error);
    res.status(500).json({ message: 'Server error retrieving timeline' });
  }
};

// Update timeline item (admin only)
exports.updateTimelineItem = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      type, 
      important 
    } = req.body;
    
    const timelineItem = await TimelineItem.findById(req.params.itemId);
    
    if (!timelineItem) {
      return res.status(404).json({ message: 'Timeline item not found' });
    }
    
    // Update fields
    if (title) timelineItem.title = title;
    if (description !== undefined) timelineItem.description = description;
    if (startTime) timelineItem.startTime = startTime;
    if (endTime !== undefined) timelineItem.endTime = endTime;
    if (location !== undefined) timelineItem.location = location;
    if (type) timelineItem.type = type;
    if (important !== undefined) timelineItem.important = important;
    
    await timelineItem.save();
    
    // Notify all users in the event about timeline update
    req.app.get('io').to(`event-${timelineItem.event}`).emit('timeline-updated');
    
    res.status(200).json({
      message: 'Timeline item updated successfully',
      timelineItem: {
        id: timelineItem._id,
        title: timelineItem.title,
        startTime: timelineItem.startTime
      }
    });
  } catch (error) {
    console.error('Update timeline item error:', error);
    res.status(500).json({ message: 'Server error updating timeline item' });
  }
};

// Delete timeline item (admin only)
exports.deleteTimelineItem = async (req, res) => {
  try {
    const timelineItem = await TimelineItem.findById(req.params.itemId);
    
    if (!timelineItem) {
      return res.status(404).json({ message: 'Timeline item not found' });
    }
    
    const eventId = timelineItem.event;
    
    await TimelineItem.findByIdAndDelete(req.params.itemId);
    
    // Notify all users in the event about timeline update
    req.app.get('io').to(`event-${eventId}`).emit('timeline-updated');
    
    res.status(200).json({ message: 'Timeline item deleted successfully' });
  } catch (error) {
    console.error('Delete timeline item error:', error);
    res.status(500).json({ message: 'Server error deleting timeline item' });
  }
};