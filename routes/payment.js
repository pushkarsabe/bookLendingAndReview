const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment');
const { authMiddleware } = require('../auth/auth');

// POST /api/payments/create-checkout-session
router.post('/create-order', authMiddleware, paymentController.createOrder);

router.post('/verify-payment', authMiddleware, paymentController.verifyPayment);

module.exports = router;