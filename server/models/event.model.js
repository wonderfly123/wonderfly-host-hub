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
  endTime: {
    type: Date
  },
  accessCode: {
    type: String,
    required: true,
    unique: true
  },
  // Add Tripleseat Event ID field
  tripleseatEventId: {
    type: String,
    index: true // Add index for faster lookups
  },
  // Add required single facility reference
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
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
  // Update status enum to match Tripleseat
  status: {
    type: String,
    enum: ['Definite', 'Closed'],
    default: 'Definite'
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