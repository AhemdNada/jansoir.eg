const Customize = require('../models/Customize');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Submit a customize request
// @route   POST /api/customize
// @access  Private
exports.submitCustomizeRequest = async (req, res) => {
    try {
        const { phoneNumber, description, size } = req.body;
        const userId = req.userId;

        // Get user to get email
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate required fields
        if (!phoneNumber || !phoneNumber.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Validate phone number - exactly 11 digits, numeric only
        const sanitizedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-numeric
        if (sanitizedPhone.length !== 11) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 11 digits'
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Description is required'
            });
        }

        if (!size || !size.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Size is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Photo is required'
            });
        }

        // Sanitize and validate description length
        const sanitizedDescription = description.trim();
        if (sanitizedDescription.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Description must be at least 10 characters'
            });
        }

        if (sanitizedDescription.length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'Description cannot exceed 2000 characters'
            });
        }

        // Sanitize size
        const sanitizedSize = size.trim();
        if (sanitizedSize.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Size cannot exceed 100 characters'
            });
        }

        // Create customize request
        const customizeRequest = await Customize.create({
            user: userId,
            email: user.email,
            phoneNumber: sanitizedPhone,
            description: sanitizedDescription,
            size: sanitizedSize,
            photo: `/uploads/customize/${req.file.filename}`,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Customize request submitted successfully',
            data: {
                customize: customizeRequest
            }
        });
    } catch (error) {
        console.error('Error submitting customize request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Get user's customize requests
// @route   GET /api/customize/my-requests
// @access  Private
exports.getMyCustomizeRequests = async (req, res) => {
    try {
        const userId = req.userId;

        const customizeRequests = await Customize.find({ user: userId })
            .sort({ createdAt: -1 })
            .select('-__v');

        res.status(200).json({
            success: true,
            count: customizeRequests.length,
            data: {
                customizeRequests
            }
        });
    } catch (error) {
        console.error('Error fetching customize requests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Get single customize request
// @route   GET /api/customize/:id
// @access  Private
exports.getCustomizeRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const customizeId = req.params.id;

        const customizeRequest = await Customize.findOne({
            _id: customizeId,
            user: userId
        });

        if (!customizeRequest) {
            return res.status(404).json({
                success: false,
                message: 'Customize request not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                customize: customizeRequest
            }
        });
    } catch (error) {
        console.error('Error fetching customize request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Get all customize requests (Admin only)
// @route   GET /api/admin/customize
// @access  Private/Admin
exports.getAllCustomizeRequests = async (req, res) => {
    try {
        const customizeRequests = await Customize.find()
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .select('-__v');

        res.status(200).json({
            success: true,
            count: customizeRequests.length,
            data: {
                customizeRequests
            }
        });
    } catch (error) {
        console.error('Error fetching customize requests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Delete customize request (Admin only)
// @route   DELETE /api/admin/customize/:id
// @access  Private/Admin
exports.deleteCustomizeRequest = async (req, res) => {
    try {
        const customizeId = req.params.id;

        const customizeRequest = await Customize.findById(customizeId);
        if (!customizeRequest) {
            return res.status(404).json({
                success: false,
                message: 'Customize request not found'
            });
        }

        // Delete associated image file
        if (customizeRequest.photo) {
            const imagePath = path.join(__dirname, '..', customizeRequest.photo);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete the request
        await Customize.findByIdAndDelete(customizeId);

        res.status(200).json({
            success: true,
            message: 'Customize request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customize request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

