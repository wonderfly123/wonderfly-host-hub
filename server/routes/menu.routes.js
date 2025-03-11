// server/routes/menu.routes.js
const express = require('express');
const menuController = require('../controllers/menu.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Create a new menu item (admin only)
router.post('/', authenticateToken, isAdmin, menuController.createMenuItem);

// Get all menu items for an event
router.get('/event/:eventId', authenticateToken, menuController.getEventMenu);

// Update menu item (admin only)
router.put('/:menuItemId', authenticateToken, isAdmin, menuController.updateMenuItem);

// Delete menu item (admin only)
router.delete('/:menuItemId', authenticateToken, isAdmin, menuController.deleteMenuItem);

module.exports = router;