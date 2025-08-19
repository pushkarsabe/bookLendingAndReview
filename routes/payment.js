const express = ('express');
const router = express.Router();
const paymentController = require('../controller/payment');
const { authMiddleware } = require('../auth/auth');

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', authMiddleware, paymentController.createCheckoutSession);

router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

module.exports = router;