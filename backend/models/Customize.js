const mongoose = require('mongoose');

const customizeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{11}$/.test(v);
            },
            message: 'Phone number must be exactly 11 digits'
        }
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    photo: {
        type: String,
        required: [true, 'Photo is required']
    },
    size: {
        type: String,
        required: [true, 'Size is required'],
        trim: true,
        maxlength: [100, 'Size cannot exceed 100 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true
});

// Index for efficient queries
customizeSchema.index({ user: 1, createdAt: -1 });
customizeSchema.index({ status: 1 });

module.exports = mongoose.model('Customize', customizeSchema);

