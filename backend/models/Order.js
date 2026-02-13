const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    category: { type: String, default: '' }, // store category slug snapshot
    size: { type: String, default: '' },
    color: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: v => /^\d{11}$/.test(v),
            message: 'Phone must be exactly 11 digits'
        }
    },
    address: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    subtotal: { type: Number, required: true, min: 0 },
    // Backward-compat field (previously used as global shipping rate). Now mirrors shippingPrice.
    shippingRate: { type: Number, default: 0, min: 0 },
    shippingGovernorate: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipping' },
        name: { type: String, default: '' }
    },
    shippingPrice: { type: Number, default: 0, min: 0 },
    coupon: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
        code: { type: String, default: '' },
        type: { type: String, enum: ['', 'percentage', 'fixed'], default: '' },
        value: { type: Number, default: 0, min: 0 }
    },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    totalWithShipping: { type: Number, default: 0, min: 0 },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'vodafone_cash', 'instapay'],
        default: 'cash_on_delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'cash_on_delivery'],
        default: 'pending'
    },
    paymentReceipt: { type: String, default: '' },
    history: [{
        status: String,
        note: String,
        changedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

