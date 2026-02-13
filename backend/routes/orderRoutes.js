const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrder, updateOrderStatus, updatePaymentStatus, deleteOrder } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const uploadReceipt = require('../middleware/receiptUpload');

// Create order (logged-in user)
router.post('/', protect, uploadReceipt.single('paymentReceipt'), createOrder);

// Get all orders (admin)
router.get('/', protect, admin, getOrders);

// Get single order (owner or admin)
router.get('/:id', protect, getOrder);

// Update status (admin)
router.put('/:id/status', protect, admin, updateOrderStatus);
// Update payment status (admin)
router.put('/:id/payment-status', protect, admin, updatePaymentStatus);
// Delete order (admin)
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;

