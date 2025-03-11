const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Register a new admin user
router.post('/register', authController.register);

// Guest login with event code
router.post('/guest-login', authController.guestLogin);

// Admin login
router.post('/admin-login', authController.adminLogin);

module.exports = router;
