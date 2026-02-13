const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../config/env');

// Protect routes - verifies JWT token and attaches principal information.
// Supports both user tokens (payload.userId) and admin tokens (payload.adminId)
// to remain backward compatible with existing flows.
exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            const decoded = jwt.verify(token, getJwtSecret());
            // Support both userId and adminId payloads
            if (decoded.userId) {
                req.userId = decoded.userId;
            }
            if (decoded.adminId) {
                req.adminId = decoded.adminId;
            }
            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Optional auth - attaches principal if token is present & valid.
// If no Authorization header, continues as guest.
exports.optionalProtect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next();
        }

        try {
            const decoded = jwt.verify(token, getJwtSecret());
            if (decoded.userId) {
                req.userId = decoded.userId;
            }
            if (decoded.adminId) {
                req.adminId = decoded.adminId;
            }
            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Restrict to admin (either a User with role=admin or an Admin record)
exports.admin = async (req, res, next) => {
    try {
        // Prefer explicit admin token
        if (req.adminId) {
            const admin = await Admin.findById(req.adminId);
            if (!admin) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only.'
                });
            }
            req.isAdmin = true;
            return next();
        }

        // Fallback: user token with admin role
        if (req.userId) {
            const user = await User.findById(req.userId);
            if (user && user.role === 'admin') {
                req.isAdmin = true;
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

