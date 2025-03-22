// server/routes/facility.routes.js
const express = require('express');
const facilityController = require('../controllers/facility.controller');

const router = express.Router();

// Get all facilities
router.get('/', facilityController.getAllFacilities);

module.exports = router;