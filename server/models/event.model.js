// server/models/event.model.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  accessCode: {
    type: String,
    required: true,
    unique: true
  },
  venue: {
    name: String,
    address: String,
    mapUrl: String
  },
  schedule: [{
    time: Date,
    title: String,
    description: String
  }],
  spotify: {
    isConnected: {
      type: Boolean,
      default: false
    },
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    preferredDeviceId: String,
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    playlistId: String,
    allowVoting: {
      type: Boolean,
      default: true
    }
  },
  staff: [{
    name: String,
    role: String,
    contactInfo: String
  }],
  environmentalSettings: {
    allowGuestControl: {
      type: Boolean,
      default: true
    },
    availableThemes: [String]
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema);