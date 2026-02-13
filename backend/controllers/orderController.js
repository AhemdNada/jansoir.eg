const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const PaymentShippingSetting = require('../models/PaymentShippingSetting');
const Shipping = require('../models/Shipping');
const Coupon = require('../models/Coupon');
const { logActivity } = require('../utils/activityLogger');
const { computeDiscountAmount, computeTotals, roundMoney } = require('../utils/pricing');

const STOCK_ERROR_CODE = 'INSUFFICIENT_STOCK';
const STOCK_ERROR_RESPONSE = 'Sorry, this product is out of stock or the requested quantity is no longer available.';

// @desc Create new order
// @route POST /api/orders
// @access Private
const createOrder = async (req, res) => {
    let session;
    try {
        let { items, phone, address, paymentMethod, shippingGovernorateId, couponCode } = req.body;

        // Handle possible JSON strings from FormData
        const parseJSONSafe = (val, fallback) => {
            if (val === undefined) return fallback;
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return fallback;
                }
            }
            return fallback;
        };

        items = parseJSONSafe(items, []);
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart items are required' });
        }
        if (!phone || !/^\d{11}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'Phone must be exactly 11 digits' });
        }
        if (!address || !address.trim()) {
            return res.status(400).json({ success: false, message: 'Address is required' });
        }
        if (!shippingGovernorateId || typeof shippingGovernorateId !== 'string') {
            return res.status(400).json({ success: false, message: 'Shipping governorate is required' });
        }

        // Payment receipt path is determined before transaction; cleaned up on failure.
        let paymentReceiptPath = '';
        if (paymentMethod === 'vodafone_cash' || paymentMethod === 'instapay') {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment receipt image is required for this method'
                });
            }
            paymentReceiptPath = `/uploads/receipts/${req.file.filename}`;
        }

        session = await mongoose.startSession();
        let createdOrder;

        await session.withTransaction(async () => {
            // Load settings inside transaction for consistency
            let settings = await PaymentShippingSetting.findOne().session(session).sort({ createdAt: -1 });
            if (!settings) {
                settings = await PaymentShippingSetting.create([{}], { session });
                settings = settings[0];
            }

            // Validate payment method against settings
            const allowedMethods = [];
            if (settings.cashOnDeliveryEnabled) allowedMethods.push('cash_on_delivery');
            if (settings.vodafoneCashEnabled) allowedMethods.push('vodafone_cash');
            if (settings.instapayEnabled) allowedMethods.push('instapay');

            if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
                throw new Error('Selected payment method is not available');
            }

            const paymentStatus = paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'pending';

            // Ensure user exists
            const user = await User.findById(req.userId).session(session);
            if (!user) {
                throw new Error('User not found');
            }

            // Normalize items with strictly atomic stock deduction per item.
            // All updates run within a transaction: either all succeed or none.
            const normalizedItems = [];

            for (const it of items) {
                const pid = it.productId || it._id || it.id;
                const size = it.size || '';
                const color = it.color || '';
                const qty = Number(it.quantity) || 1;

                const hasVariants = await Product.exists({ _id: pid, variants: { $exists: true, $not: { $size: 0 } } }).session(session);
                if (hasVariants) {
                    const updated = await Product.findOneAndUpdate(
                        {
                            _id: pid,
                            variants: {
                                $elemMatch: {
                                    size: size || '',
                                    color: color || '',
                                    quantity: { $gte: qty }
                                }
                            }
                        },
                        { $inc: { 'variants.$.quantity': -qty } },
                        { new: true, session }
                    );
                    if (!updated) {
                        const err = new Error(STOCK_ERROR_CODE);
                        err.code = STOCK_ERROR_CODE;
                        throw err;
                    }
                } else {
                    const updated = await Product.findOneAndUpdate(
                        { _id: pid, stock: { $gte: qty } },
                        { $inc: { stock: -qty } },
                        { new: true, session }
                    );
                    if (!updated) {
                        const err = new Error(STOCK_ERROR_CODE);
                        err.code = STOCK_ERROR_CODE;
                        throw err;
                    }
                }

                normalizedItems.push({
                    productId: pid,
                    name: it.name,
                    price: Number(it.price) || 0,
                    quantity: qty,
                    image: it.image || '',
                    category: it.category || '',
                    size,
                    color
                });
            }

            const computedSubtotal = normalizedItems.reduce((sum, it) => {
                const price = Number(it.price) || 0;
                const qty = Number(it.quantity) || 0;
                return sum + (price * qty);
            }, 0);
            const subtotalValue = roundMoney(computedSubtotal);

            // Shipping is now driven ONLY by Shipping collection
            const shippingDoc = await Shipping.findById(shippingGovernorateId).session(session);
            if (!shippingDoc) {
                const err = new Error('Invalid shipping governorate');
                err.statusCode = 400;
                throw err;
            }
            const shippingPrice = roundMoney(Number(shippingDoc.shippingPrice) || 0);

            // Coupon is optional and driven ONLY by Coupon collection
            let couponSnapshot = { id: null, code: '', type: '', value: 0 };
            let discountAmount = 0;
            const normalizedCouponKey = typeof couponCode === 'string'
                ? couponCode.replace(/\s+/g, '').trim().toLowerCase()
                : '';

            if (normalizedCouponKey) {
                const coupon = await Coupon.findOne({ codeKey: normalizedCouponKey, isActive: true }).session(session);
                if (!coupon) {
                    const err = new Error('Invalid or inactive coupon code');
                    err.statusCode = 400;
                    throw err;
                }
                couponSnapshot = { id: coupon._id, code: coupon.code, type: coupon.type, value: coupon.value };
                discountAmount = computeDiscountAmount({ subtotal: subtotalValue, type: coupon.type, value: coupon.value });
            }

            const totals = computeTotals({ subtotal: subtotalValue, shippingPrice, discountAmount });

            const orderDocs = await Order.create([{
                user: user._id,
                items: normalizedItems,
                phone,
                address: address.trim(),
                subtotal: totals.subtotal,
                shippingGovernorate: { id: shippingDoc._id, name: shippingDoc.name },
                shippingPrice: totals.shippingPrice,
                // backward-compat: keep shippingRate in sync with shippingPrice
                shippingRate: totals.shippingPrice,
                coupon: couponSnapshot,
                discountAmount: totals.discountAmount,
                total: totals.total,
                totalWithShipping: totals.totalWithShipping,
                paymentMethod,
                paymentStatus,
                paymentReceipt: paymentReceiptPath,
                history: [{ status: 'Pending', note: 'Order created' }]
            }], { session });

            createdOrder = orderDocs[0];
        });

        logActivity({
            type: 'order',
            action: 'Order created',
            details: `Order #${createdOrder._id} created with ${createdOrder.items.length} item(s)`,
            entityType: 'order',
            entityId: createdOrder._id,
            severity: 'info'
        }, { userId: req.userId, adminId: req.adminId });

        return res.status(201).json({ success: true, data: createdOrder });
    } catch (error) {
        if (session && session.inTransaction()) {
            try {
                await session.abortTransaction();
            } catch (abortErr) {
                console.error('Abort transaction failed:', abortErr);
            }
        }

        // Clean up uploaded receipt if something failed after upload
        if (req.file) {
            const receiptPath = path.join(__dirname, '..', 'uploads', 'receipts', req.file.filename);
            if (fs.existsSync(receiptPath)) {
                try { fs.unlinkSync(receiptPath); } catch (err) { console.error('Cleanup receipt failed:', err); }
            }
        }

        if (error && (error.code === STOCK_ERROR_CODE || error.message === STOCK_ERROR_CODE || (typeof error.message === 'string' && error.message.includes('Quantity exceeds')))) {
            return res.status(400).json({
                success: false,
                message: STOCK_ERROR_RESPONSE
            });
        }

        if (error && error.message === 'Selected payment method is not available') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        if (error && (error.message === 'Invalid shipping governorate' || error.message === 'Invalid or inactive coupon code')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error && error.message === 'User not found') {
            return res.status(401).json({ success: false, message: error.message });
        }

        console.error('Error creating order:', error);
        const message = error && typeof error.message === 'string' ? error.message : 'Server error while creating order';
        res.status(500).json({ success: false, message });
    } finally {
        if (session) {
            session.endSession().catch(() => {});
        }
    }
};

// @desc Get all orders
// @route GET /api/orders
// @access Private/Admin
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching orders' });
    }
};

// @desc Get single order
// @route GET /api/orders/:id
// @access Private/Admin or owner
const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'firstName lastName email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const isAdmin = !!req.isAdmin;
        // Allow owner
        if (order.user._id.toString() !== req.userId && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching order' });
    }
};

// @desc Update order status
// @route PUT /api/orders/:id/status
// @access Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const allowed = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findOneAndUpdate(
            { _id: req.params.id },
            {
                $set: { status },
                $push: { history: { status, note: note || `Status changed to ${status}`, changedAt: new Date() } }
            },
            { new: true, runValidators: true }
        ).populate('user', 'firstName lastName email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        logActivity({
            type: 'order',
            action: 'Order status updated',
            details: `Order #${order._id} status changed to ${status}${note ? ` (${note})` : ''}`,
            entityType: 'order',
            entityId: order._id,
            severity: ['Cancelled'].includes(status) ? 'warning' : 'info'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error while updating order' });
    }
};

// @desc Update order payment status
// @route PUT /api/orders/:id/payment-status
// @access Private/Admin
const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const allowed = ['pending', 'paid', 'cash_on_delivery'];

        if (!paymentStatus || !allowed.includes(paymentStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }

        const order = await Order.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { paymentStatus } },
            { new: true, runValidators: true }
        ).populate('user', 'firstName lastName email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        logActivity({
            type: 'order',
            action: 'Payment status updated',
            details: `Order #${order._id} payment status set to ${paymentStatus}`,
            entityType: 'order',
            entityId: order._id,
            severity: paymentStatus === 'pending' ? 'warning' : 'info'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ success: false, message: 'Server error while updating payment status' });
    }
};

// @desc Delete order
// @route DELETE /api/orders/:id
// @access Private/Admin
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        await Order.deleteOne({ _id: id });

        logActivity({
            type: 'order',
            action: 'Order deleted',
            details: `Order #${id} deleted by admin`,
            entityType: 'order',
            entityId: id,
            severity: 'warning'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting order' });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder
};

