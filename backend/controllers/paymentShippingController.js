const PaymentShippingSetting = require('../models/PaymentShippingSetting');
const { logActivity } = require('../utils/activityLogger');

// Get settings (public)
const getPaymentShippingSettings = async (req, res) => {
    try {
        let settings = await PaymentShippingSetting.findOne().sort({ createdAt: -1 });

        // Initialize defaults if not present
        if (!settings) {
            settings = await PaymentShippingSetting.create({});
        }

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching payment & shipping settings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching settings'
        });
    }
};

// Update settings (admin)
const updatePaymentShippingSettings = async (req, res) => {
    try {
        const {
            cashOnDeliveryEnabled,
            vodafoneCashEnabled,
            vodafoneCashNumber,
            instapayEnabled,
            instapayNumber
        } = req.body;

        const update = {
            cashOnDeliveryEnabled: cashOnDeliveryEnabled !== undefined ? cashOnDeliveryEnabled === 'true' || cashOnDeliveryEnabled === true : undefined,
            vodafoneCashEnabled: vodafoneCashEnabled !== undefined ? vodafoneCashEnabled === 'true' || vodafoneCashEnabled === true : undefined,
            vodafoneCashNumber: vodafoneCashNumber !== undefined ? String(vodafoneCashNumber || '').trim() : undefined,
            instapayEnabled: instapayEnabled !== undefined ? instapayEnabled === 'true' || instapayEnabled === true : undefined,
            instapayNumber: instapayNumber !== undefined ? String(instapayNumber || '').trim() : undefined
        };

        
        Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);

        const settings = await PaymentShippingSetting.findOneAndUpdate(
            {},
            { $set: update },
            { new: true, upsert: true }
        );

        logActivity({
            type: 'settings',
            action: 'Payment & shipping settings updated',
            details: 'Payment/shipping configuration updated by admin',
            entityType: 'settings',
            entityId: settings?._id,
            severity: 'info'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(200).json({
            success: true,
            message: 'Payment & Shipping settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Error updating payment & shipping settings:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating settings'
        });
    }
};

module.exports = {
    getPaymentShippingSettings,
    updatePaymentShippingSettings
};

