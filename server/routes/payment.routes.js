// server/routes/payment.routes.js
const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get Square application info
router.get('/square-info', authenticateToken, paymentController.getSquareAppInfo);

// Process payment
router.post('/process', authenticateToken, paymentController.processPayment);

// Get payment status
router.get('/:orderId/status', authenticateToken, paymentController.getPaymentStatus);

module.exports = router;