// server/controllers/event.controller.js
const Event = require('../models/event.model');

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { name, description, date, endTime, status, facility, tripleseatEventId } = req.body;
    
    console.log('Received event data:', { 
      name, description, date, endTime, status, facility, tripleseatEventId
    });
    
    // Generate a random 6-character access code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const event = new Event({
      name,
      description,
      date,
      endTime,
      accessCode,
      status, // Now can be 'Definite' or 'Closed'
      facility,
      tripleseatEventId, // Add Tripleseat Event ID
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
        endTime: event.endTime,
        status: event.status,
        tripleseatEventId: event.tripleseatEventId,
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
        endTime: event.endTime,
        accessCode: event.accessCode,
        status: event.status,
        tripleseatEventId: event.tripleseatEventId
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
    const event = await Event.findById(req.params.eventId).populate('facility');
    
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
    const { name, description, date, endTime, schedule, spotify, status, facility, tripleseatEventId } = req.body;
    
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
    if (endTime !== undefined) event.endTime = endTime;
    if (schedule) event.schedule = schedule;
    if (spotify) event.spotify = spotify;
    if (status) event.status = status;
    if (facility) event.facility = facility;
    if (tripleseatEventId) event.tripleseatEventId = tripleseatEventId;
    
    await event.save();
    
    res.status(200).json({
      message: 'Event updated successfully',
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        endTime: event.endTime,
        status: event.status,
        tripleseatEventId: event.tripleseatEventId
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

// Find event by Tripleseat ID
exports.findByTripleseatId = async (req, res) => {
  try {
    const tripleseatEventId = req.params.tripleseatId;
    
    const event = await Event.findOne({ tripleseatEventId });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json({ event });
  } catch (error) {
    console.error('Find by Tripleseat ID error:', error);
    res.status(500).json({ 
      message: 'Server error while retrieving event',
      error: error.message 
    });
  }
};