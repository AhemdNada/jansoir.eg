const mongoose = require('mongoose');

const paymentShippingSettingSchema = new mongoose.Schema({
    cashOnDeliveryEnabled: { type: Boolean, default: true },
    vodafoneCashEnabled: { type: Boolean, default: false },
    vodafoneCashNumber: { type: String, default: '' },
    instapayEnabled: { type: Boolean, default: false },
    instapayNumber: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('PaymentShippingSetting', paymentShippingSettingSchema);

