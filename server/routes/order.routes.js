// server/routes/order.routes.js
const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Create a new order
router.post('/', authenticateToken, orderController.createOrder);

// Get user orders
router.get('/user', authenticateToken, orderController.getUserOrders);

// Get order details
router.get('/:orderId', authenticateToken, orderController.getOrderDetails);

// Update order status (admin only)
router.put('/:orderId/status', authenticateToken, isAdmin, orderController.updateOrderStatus);

// Get event orders (admin only)
router.get('/event/:eventId', authenticateToken, isAdmin, orderController.getEventOrders);

module.exports = router;