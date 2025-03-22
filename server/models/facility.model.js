// server/models/facility.model.js
const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Facility', facilitySchema);