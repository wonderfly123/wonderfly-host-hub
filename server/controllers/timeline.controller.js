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
    
    console.log('Creating timeline item with data:', JSON.stringify({
      eventId, title, startTime, endTime, location
    }, null, 2));
    
    // Validate inputs
    if (!eventId || !title || !startTime) {
      return res.status(400).json({ message: 'Event ID, title, and start time are required' });
    }
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Parse dates to ensure they are stored properly
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = endTime ? new Date(endTime) : undefined;
    
    console.log('Parsed dates:');
    console.log('- Start time:', parsedStartTime.toISOString(), '(timestamp:', parsedStartTime.getTime(), ')');
    if (parsedEndTime) {
      console.log('- End time:', parsedEndTime.toISOString(), '(timestamp:', parsedEndTime.getTime(), ')');
    }
    
    // Create timeline item
    const timelineItem = new TimelineItem({
      event: eventId,
      title,
      description,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      location,
      type: type || 'activity',
      important: important || false,
      createdBy: req.userId
    });
    
    await timelineItem.save();
    console.log('Timeline item saved with ID:', timelineItem._id);
    
    // If marked as important, create notifications for all event users
    if (important) {
      const users = await User.find({ eventCode: event.accessCode });
      
      for (const user of users) {
        const notification = new Notification({
          user: user._id,
          event: eventId,
          title: 'New Important Event Added',
          message: `"${title}" has been added to the schedule at ${parsedStartTime.toLocaleTimeString()}`,
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
    console.log('========================================');
    console.log('TIMELINE DEBUG: Getting timeline for event:', eventId);
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('Event not found for timeline request:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // First get all items without sorting to see what we're working with
    const allItems = await TimelineItem.find({ event: eventId });
    console.log(`Found ${allItems.length} total timeline items for event ${eventId}`);
    
    // Debug log all items with their original start times
    console.log('ALL TIMELINE ITEMS (ORIGINAL ORDER):');
    allItems.forEach((item, index) => {
      const startTime = new Date(item.startTime);
      console.log(`${index+1}. ID: ${item._id}, Title: ${item.title}`);
      console.log(`   Start time (raw): ${item.startTime}`);
      console.log(`   Start time (parsed): ${startTime}`);
      console.log(`   Timestamp: ${startTime.getTime()}`);
    });
    
    // Try multiple sorting approaches
    // 1. Standard MongoDB sort
    console.log('\nSORTING WITH MONGODB:');
    const sortedItems = await TimelineItem.find({ event: eventId })
      .sort({ startTime: 1 });
    
    console.log('TIMELINE ITEMS (MONGODB SORTED):');
    sortedItems.forEach((item, index) => {
      const startTime = new Date(item.startTime);
      console.log(`${index+1}. "${item.title}" - Start time: ${startTime.toLocaleString()}, Timestamp: ${startTime.getTime()}`);
    });
    
    // 2. Manual JavaScript sort (as a fallback)
    console.log('\nSORTING WITH JAVASCRIPT:');
    const manualSortedItems = [...allItems].sort((a, b) => {
      const aTime = new Date(a.startTime).getTime();
      const bTime = new Date(b.startTime).getTime();
      console.log(`Comparing: "${a.title}" (${aTime}) vs "${b.title}" (${bTime})`);
      return aTime - bTime;
    });
    
    console.log('TIMELINE ITEMS (JAVASCRIPT SORTED):');
    manualSortedItems.forEach((item, index) => {
      const startTime = new Date(item.startTime);
      console.log(`${index+1}. "${item.title}" - Start time: ${startTime.toLocaleString()}, Timestamp: ${startTime.getTime()}`);
    });
    
    // 3. Convert to a simple format for the response
    const simplifiedItems = manualSortedItems.map(item => {
      const startTime = new Date(item.startTime);
      const endTime = item.endTime ? new Date(item.endTime) : null;
      
      return {
        _id: item._id,
        title: item.title,
        description: item.description,
        location: item.location,
        type: item.type,
        startTime: startTime.toISOString(),
        endTime: endTime ? endTime.toISOString() : null,
        // Add debug timestamps
        _debug_startTimestamp: startTime.getTime()
      };
    });
    
    console.log('\nSending sorted timeline response');
    console.log('========================================');
    
    // Send the manually sorted items
    res.status(200).json({ timelineItems: simplifiedItems });
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
    
    console.log('Updating timeline item:', req.params.itemId);
    console.log('Update data:', JSON.stringify({
      title, startTime, endTime, location
    }, null, 2));
    
    const timelineItem = await TimelineItem.findById(req.params.itemId);
    
    if (!timelineItem) {
      return res.status(404).json({ message: 'Timeline item not found' });
    }
    
    // Store original start time for debugging
    const originalStartTime = timelineItem.startTime;
    console.log('Original start time:', originalStartTime);
    
    // Update fields
    if (title) timelineItem.title = title;
    if (description !== undefined) timelineItem.description = description;
    
    // Handle date fields carefully
    if (startTime) {
      const parsedStartTime = new Date(startTime);
      console.log('New start time (parsed):', parsedStartTime);
      timelineItem.startTime = parsedStartTime;
    }
    
    if (endTime !== undefined) {
      timelineItem.endTime = endTime ? new Date(endTime) : undefined;
    }
    
    if (location !== undefined) timelineItem.location = location;
    if (type) timelineItem.type = type;
    if (important !== undefined) timelineItem.important = important;
    
    await timelineItem.save();
    console.log('Timeline item updated successfully');
    
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