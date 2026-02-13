const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/activityLogger');
const { getJwtSecret } = require('../config/env');

// @desc    Create a new admin
// @route   POST /api/admins
const createAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }

        const admin = await Admin.create({
            email: email.toLowerCase().trim(),
            password
        });

        logActivity({
            type: 'system',
            action: 'Admin created',
            details: `Admin account created for ${admin.email}`,
            entityType: 'admin',
            entityId: admin._id,
            severity: 'info'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: admin
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating admin'
        });
    }
};

// @desc    Login admin
// @route   POST /api/admins/login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Primary bcrypt comparison
        let isMatch = await admin.comparePassword(password);

        // Backward-compat: if password was stored unhashed previously, accept once and re-hash
        if (!isMatch && admin.password === password) {
            admin.password = password;
            await admin.save();
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign({ adminId: admin._id }, getJwtSecret(), {
            expiresIn: '30d'
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                admin,
                token
            }
        });
    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while logging in admin'
        });
    }
};

// @desc    Get all admins
// @route   GET /api/admins
const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while fetching admins'
        });
    }
};

// @desc    Update an admin
// @route   PUT /api/admins/:id
const updateAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { id } = req.params;

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (email) {
            const normalizedEmail = email.toLowerCase().trim();

            // Check for email uniqueness
            const existingAdmin = await Admin.findOne({ email: normalizedEmail });
            if (existingAdmin && existingAdmin.id !== id) {
                return res.status(400).json({
                    success: false,
                    message: 'Another admin already uses this email'
                });
            }

            admin.email = normalizedEmail;
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }
            admin.password = password;
        }

        await admin.save();

        res.status(200).json({
            success: true,
            message: 'Admin updated successfully',
            data: admin
        });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating admin'
        });
    }
};

// @desc    Delete an admin
// @route   DELETE /api/admins/:id
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Admin.findById(id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        await admin.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Admin deleted successfully'
        });

        logActivity({
            type: 'system',
            action: 'Admin deleted',
            details: `Admin account deleted for ${admin.email}`,
            entityType: 'admin',
            entityId: admin._id,
            severity: 'warning'
        }, { adminId: req.adminId, userId: req.userId });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while deleting admin'
        });
    }
};

module.exports = {
    createAdmin,
    loginAdmin,
    getAdmins,
    updateAdmin,
    deleteAdmin
};


