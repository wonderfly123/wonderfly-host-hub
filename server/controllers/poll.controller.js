// server/controllers/poll.controller.js
const Poll = require('../models/poll.model');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Helper function to find the winning option
const findWinningOption = (poll) => {
  if (!poll.options.length) return null;
  
  // Find the option with maximum votes
  let maxVotes = 0;
  let winningOptions = [];
  
  poll.options.forEach((option, index) => {
    if (option.votes > maxVotes) {
      maxVotes = option.votes;
      winningOptions = [{ option, index }];
    } else if (option.votes === maxVotes) {
      winningOptions.push({ option, index });
    }
  });
  
  // If there's a tie, pick randomly
  const winner = winningOptions[Math.floor(Math.random() * winningOptions.length)];
  
  // Return the winning option with its details
  return poll.type === 'activity' && poll.activityOptions && poll.activityOptions[winner.index]
    ? {
        text: winner.option.text,
        votes: winner.option.votes,
        details: poll.activityOptions[winner.index].details,
        timelineItemId: poll.activityOptions[winner.index].timelineItem
      }
    : {
        text: winner.option.text,
        votes: winner.option.votes
      };
};

// Create a new poll (admin only)
exports.createPoll = async (req, res) => {
  try {
    const { eventId, question, options, type, activityOptions, duration } = req.body;
    
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
    
    // Create poll with additional fields for activity type
    const poll = new Poll({
      event: eventId,
      question,
      options: options.map(option => ({ text: option, votes: 0 })),
      type: type || 'general',
      activityOptions: type === 'activity' ? activityOptions : undefined,
      createdBy: req.userId,
      // Add automatic closing time if duration provided
      ...(duration && { 
        autoCloseAt: new Date(Date.now() + duration * 60 * 1000) 
      })
    });
    
    await poll.save();
    
    // If this is an activity poll, create notifications for all users
    if (type === 'activity') {
      // Get all users for this event
      const users = await User.find({ eventCode: event.accessCode });
      
      // Create notification for each user
      for (const user of users) {
        const notification = new Notification({
          user: user._id,
          event: eventId,
          title: "New Activity Vote",
          message: `Vote now for the next activity: "${question}"`,
          type: 'info',
          read: false,
          metadata: {
            type: 'poll',
            pollId: poll._id
          }
        });
        
        await notification.save();
        
        // Send real-time notification to individual user
        req.app.get('io').to(`user-${user._id}`).emit('new-notification', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
          read: notification.read,
          metadata: notification.metadata
        });
      }
    }
    
    // If this poll has an auto-close time, schedule the closing
    if (poll.autoCloseAt) {
      const timeUntilClose = new Date(poll.autoCloseAt) - new Date();
      setTimeout(async () => {
        try {
          // Close the poll automatically when time expires
          await Poll.findByIdAndUpdate(poll._id, { 
            isActive: false,
            closedAt: new Date()
          });
          
          // Notify all clients that poll has closed
          req.app.get('io').to(`event-${eventId}`).emit('poll-closed', {
            id: poll._id
          });
          
          // Find the winning option
          const updatedPoll = await Poll.findById(poll._id);
          const winningOption = findWinningOption(updatedPoll);
          
          // Announce the winner
          if (winningOption) {
            req.app.get('io').to(`event-${eventId}`).emit('activity-selected', {
              pollId: poll._id,
              activity: winningOption
            });
            
            // Create notification for the winning activity
            const users = await User.find({ eventCode: event.accessCode });
            for (const user of users) {
              const notification = new Notification({
                user: user._id,
                event: eventId,
                title: "Activity Selected",
                message: `"${winningOption.text}" won the vote and has been selected as the next activity.`,
                type: 'success',
                read: false
              });
              
              await notification.save();
              
              // Send real-time notification
              req.app.get('io').to(`user-${user._id}`).emit('new-notification', {
                _id: notification._id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                createdAt: notification.createdAt,
                read: notification.read
              });
            }
          }
        } catch (error) {
          console.error('Error in auto-closing poll:', error);
        }
      }, timeUntilClose);
    }
    
    // Notify all clients in the event room
    req.app.get('io').to(`event-${eventId}`).emit('new-poll', {
      id: poll._id,
      question: poll.question,
      type: poll.type
    });
    
    res.status(201).json({
      message: 'Poll created successfully',
      poll: {
        id: poll._id,
        question: poll.question,
        options: poll.options,
        type: poll.type
      }
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ message: 'Server error creating poll' });
  }
};

// Get polls for an event (including active and completed)
exports.getEventPolls = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const polls = await Poll.find({ 
      event: eventId
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
    
    // Find the winning option for activity polls
    if (poll.type === 'activity') {
      const winningOption = findWinningOption(poll);
      
      if (winningOption) {
        // Notify all clients about the selected activity
        req.app.get('io').to(`event-${poll.event}`).emit('activity-selected', {
          pollId: poll._id,
          activity: winningOption
        });
        
        // Create notification for the winning activity
        const event = await Event.findById(poll.event);
        const users = await User.find({ eventCode: event.accessCode });
        
        for (const user of users) {
          const notification = new Notification({
            user: user._id,
            event: poll.event,
            title: "Activity Selected",
            message: `"${winningOption.text}" won the vote and has been selected as the next activity.`,
            type: 'success',
            read: false
          });
          
          await notification.save();
          
          // Send real-time notification
          req.app.get('io').to(`user-${user._id}`).emit('new-notification', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            createdAt: notification.createdAt,
            read: notification.read
          });
        }
      }
    }
    
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