// server/controllers/facility.controller.js
const Facility = require('../models/facility.model');

// Get all facilities
exports.getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({});
    
    res.status(200).json({
      facilities: facilities.map(facility => ({
        id: facility._id,
        name: facility.name,
        description: facility.description
      }))
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ message: 'Server error while retrieving facilities' });
  }
};