// server/models/votingQueue.model.js
const mongoose = require('mongoose');

const votingQueueSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  tracks: [{
    trackId: String,
    name: String,
    artists: String,
    imageUrl: String,
    votes: {
      type: Number,
      default: 0
    },
    voters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currentTrack: {
    trackId: String,
    name: String,
    artists: String,
    imageUrl: String,
    startedAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('VotingQueue', votingQueueSchema);