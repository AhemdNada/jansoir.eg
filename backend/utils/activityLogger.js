const ActivityHistory = require('../models/ActivityHistory');
const Admin = require('../models/Admin');
const User = require('../models/User');

/**
 * Build an actor snapshot for logging purposes.
 * @param {{adminId?: string, userId?: string, fallbackName?: string}} ctx
 * @returns {Promise<{kind: 'admin'|'user'|'system', refId?: string, name?: string, email?: string}>}
 */
const resolveActor = async (ctx = {}) => {
    try {
        if (ctx.adminId) {
            const admin = await Admin.findById(ctx.adminId).select('email');
            if (admin) {
                return {
                    kind: 'admin',
                    refId: admin._id,
                    name: admin.email,
                    email: admin.email
                };
            }
        }

        if (ctx.userId) {
            const user = await User.findById(ctx.userId).select('firstName lastName email');
            if (user) {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                return {
                    kind: 'user',
                    refId: user._id,
                    name: fullName || user.email,
                    email: user.email
                };
            }
        }
    } catch (err) {
        // fall through to system actor
        console.error('Activity logger actor resolution error:', err);
    }

    return {
        kind: 'system',
        name: ctx.fallbackName || 'System',
        email: ''
    };
};

/**
 * Centralized, non-blocking activity logger.
 * Accepts context to resolve actor and ensures failures never block main flow.
 */
const logActivity = (payload = {}, context = {}) => {
    setImmediate(async () => {
        try {
            const {
                type,
                action,
                details = '',
                entityType = null,
                entityId = null,
                severity = 'info',
                performedBy = null
            } = payload;

            if (!type || !action) {
                return;
            }

            const actor = performedBy || await resolveActor(context);

            await ActivityHistory.create({
                type,
                action,
                details,
                entityType,
                entityId,
                severity,
                performedBy: actor
            });
        } catch (err) {
            console.error('Activity logging failed (non-blocking):', err?.message || err);
        }
    });
};

module.exports = {
    logActivity,
    resolveActor
};


