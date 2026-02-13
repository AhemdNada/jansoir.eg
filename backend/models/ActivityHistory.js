const mongoose = require('mongoose');

const activityHistorySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['order', 'product', 'customer', 'settings', 'payment', 'system'],
        required: true,
        index: true
    },
    action: { type: String, required: true, trim: true },
    details: { type: String, default: '', trim: true },
    entityType: {
        type: String,
        enum: ['order', 'product', 'user', 'admin', 'category', 'settings', 'payment', null],
        default: null
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    performedBy: {
        kind: { type: String, enum: ['admin', 'user', 'system'], default: 'system', index: true },
        refId: { type: mongoose.Schema.Types.ObjectId, default: null },
        name: { type: String, default: '' },
        email: { type: String, default: '' }
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info',
        index: true
    }
}, { timestamps: true });

activityHistorySchema.index({ createdAt: -1 });
activityHistorySchema.index({ type: 1, createdAt: -1 });
activityHistorySchema.index({ severity: 1, createdAt: -1 });
activityHistorySchema.index({ action: 'text', details: 'text' });

module.exports = mongoose.model('ActivityHistory', activityHistorySchema);


