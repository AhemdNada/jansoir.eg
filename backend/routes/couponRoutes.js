const express = require('express');
const router = express.Router();

const asyncHandler = require('../middleware/asyncHandler');
const { protect, admin } = require('../middleware/authMiddleware');
const couponController = require('../controllers/couponController');

// Public validation
router.post('/validate', asyncHandler(couponController.validateCoupon));

// Admin CRUD
router.get('/', protect, admin, asyncHandler(couponController.getCoupons));
router.post('/', protect, admin, asyncHandler(couponController.createCoupon));
router.put('/:id', protect, admin, asyncHandler(couponController.updateCoupon));
router.delete('/:id', protect, admin, asyncHandler(couponController.deleteCoupon));

module.exports = router;

