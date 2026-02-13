const express = require('express');
const router = express.Router();

const asyncHandler = require('../middleware/asyncHandler');
const { protect, admin } = require('../middleware/authMiddleware');
const shippingController = require('../controllers/shippingController');

// Public
router.get('/', asyncHandler(shippingController.getShipping));

// Admin
router.post('/', protect, admin, asyncHandler(shippingController.createShipping));
router.put('/bulk', protect, admin, asyncHandler(shippingController.bulkUpdateShipping));
router.put('/:id', protect, admin, asyncHandler(shippingController.updateShipping));

module.exports = router;

