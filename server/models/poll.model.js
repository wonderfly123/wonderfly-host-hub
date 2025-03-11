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