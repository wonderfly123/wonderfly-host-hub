// server/models/poll.model.js
const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    votes: {
      type: Number,
      default: 0
    }
  }],
  type: {
    type: String,
    enum: ['general', 'activity', 'music', 'food'],
    default: 'general'
  },
  activityOptions: [{
    timelineItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimelineItem'
    },
    details: {
      time: String,
      location: String,
      description: String
    }
  }],
  autoCloseAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date
});

module.exports = mongoose.model('Poll', pollSchema);