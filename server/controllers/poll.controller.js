// server/controllers/poll.controller.js
const Poll = require('../models/poll.model');
const Event = require('../models/event.model');

// Create a new poll (admin only)
exports.createPoll = async (req, res) => {
  try {
    const { eventId, question, options } = req.body;
    
    if (!eventId || !question || !options || options.length < 2) {
      return res.status(400).json({ 
        message: 'Event ID, question, and at least 2 options are required' 
      });
    }
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Create poll
    const poll = new Poll({
      event: eventId,
      question,
      options: options.map(option => ({ text: option, votes: 0 })),
      createdBy: req.userId
    });
    
    await poll.save();
    
    // Notify all clients in the event room
    req.app.get('io').to(`event-${eventId}`).emit('new-poll', {
      id: poll._id,
      question: poll.question
    });
    
    res.status(201).json({
      message: 'Poll created successfully',
      poll: {
        id: poll._id,
        question: poll.question,
        options: poll.options
      }
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ message: 'Server error creating poll' });
  }
};

// Get active polls for an event
exports.getEventPolls = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const polls = await Poll.find({ 
      event: eventId,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.status(200).json({ polls });
  } catch (error) {
    console.error('Get event polls error:', error);
    res.status(500).json({ message: 'Server error retrieving polls' });
  }
};

// Vote on a poll
exports.votePoll = async (req, res) => {
  try {
    const { pollId, optionIndex } = req.body;
    
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    if (!poll.isActive) {
      return res.status(400).json({ message: 'Poll is no longer active' });
    }
    
    // Check if option exists
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option index' });
    }
    
    // Check if user already voted
    if (poll.voters.includes(req.userId)) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }
    
    // Add vote
    poll.options[optionIndex].votes += 1;
    poll.voters.push(req.userId);
    
    await poll.save();
    
    // Notify all clients in the event room
    req.app.get('io').to(`event-${poll.event}`).emit('poll-updated', {
      id: poll._id,
      options: poll.options.map(option => ({
        text: option.text,
        votes: option.votes
      }))
    });
    
    res.status(200).json({
      message: 'Vote recorded successfully',
      options: poll.options
    });
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({ message: 'Server error recording vote' });
  }
};

// Close a poll (admin only)
exports.closePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    // Close poll
    poll.isActive = false;
    poll.closedAt = Date.now();
    
    await poll.save();
    
    // Notify all clients in the event room
    req.app.get('io').to(`event-${poll.event}`).emit('poll-closed', {
      id: poll._id
    });
    
    res.status(200).json({
      message: 'Poll closed successfully',
      poll: {
        id: poll._id,
        question: poll.question,
        options: poll.options,
        closedAt: poll.closedAt
      }
    });
  } catch (error) {
    console.error('Close poll error:', error);
    res.status(500).json({ message: 'Server error closing poll' });
  }
};