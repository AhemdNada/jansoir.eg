const express = require('express');
const router = express.Router();
const { getPaymentShippingSettings, updatePaymentShippingSettings } = require('../controllers/paymentShippingController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public: fetch settings
router.get('/payment-shipping', getPaymentShippingSettings);

// Admin: update settings
router.put('/payment-shipping', protect, admin, updatePaymentShippingSettings);

module.exports = router;

