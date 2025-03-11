const Event = require('../models/event.model');

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { name, description, date, venue, schedule, spotify } = req.body;
    
    // Generate a random 6-character access code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const event = new Event({
      name,
      description,
      date,
      accessCode,
      venue,
      schedule,
      spotify,
      createdBy: req.userId
    });
    
    await event.save();
    
    res.status(201).json({
      message: 'Event created successfully',
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        accessCode: event.accessCode
      }
    });
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ message: 'Server error during event creation' });
  }
};

// Get all events (admin only)
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ date: -1 });
    
    res.status(200).json({
      events: events.map(event => ({
        id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        accessCode: event.accessCode,
        status: event.status
      }))
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error while retrieving events' });
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error while retrieving event' });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const { name, description, date, venue, schedule, spotify, status } = req.body;
    
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized (admin or event creator)
    if (req.userRole !== 'admin' && event.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }
    
    // Update fields
    if (name) event.name = name;
    if (description) event.description = description;
    if (date) event.date = date;
    if (venue) event.venue = venue;
    if (schedule) event.schedule = schedule;
    if (spotify) event.spotify = spotify;
    if (status) event.status = status;
    
    await event.save();
    
    res.status(200).json({
      message: 'Event updated successfully',
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        status: event.status
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error during event update' });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized (admin or event creator)
    if (req.userRole !== 'admin' && event.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    
    await Event.findByIdAndDelete(req.params.eventId);
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error during event deletion' });
  }
};