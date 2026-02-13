const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [2, 'Product name must be at least 2 characters'],
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        lowercase: true
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
        default: ''
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        trim: true
    },
    brand: {
        type: String,
        trim: true,
        default: ''
    },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Stock cannot be negative']
        // retained only for legacy fallback when no variants exist
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    image: {
        type: String,
        required: [true, 'Product image is required']
    },
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function(images) {
                // Minimum 1 image required
                return images && images.length >= 1;
            },
            message: 'At least one product image is required'
        }
    },
    keyFeatures: {
        type: [String],
        default: [],
        validate: {
            validator: function(features) {
                if (!Array.isArray(features)) {
                    return false;
                }
                // Maximum 10 features
                if (features.length > 10) {
                    return false;
                }
                // Check for duplicates (case-insensitive) - only check if all are strings
                if (features.length > 0) {
                    const stringFeatures = features.filter(f => typeof f === 'string');
                    if (stringFeatures.length !== features.length) {
                        return false; // All features must be strings
                    }
                    const lowerFeatures = stringFeatures.map(f => f.trim().toLowerCase());
                    const uniqueFeatures = new Set(lowerFeatures);
                    return uniqueFeatures.size === features.length;
                }
                return true; // Empty array is valid
            },
            message: 'Maximum 10 key features allowed, and duplicates are not permitted'
        }
    },
    sizes: {
        type: [String],
        default: []
    },
    colors: {
        type: [String],
        default: []
    },
    variants: {
        type: [{
            size: { type: String, default: '' },
            color: { type: String, default: '' },
            quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
            price: { type: Number, required: true, min: [0.01, 'Variant price must be greater than 0'] }
        }],
        default: []
    }
}, {
    timestamps: true
});

// Sanitize and validate key features before saving
productSchema.pre('save', async function () {
    // Auto-generate slug from name
    if (this.isModified('name') && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    const sanitizeArray = (arr, maxLen = 50) => {
        if (!Array.isArray(arr)) return [];
        const cleaned = arr
            .map(v => typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '')
            .filter(v => v.length > 0 && v.length <= maxLen);
        // dedupe case-insensitive
        const seen = new Set();
        return cleaned.filter(v => {
            const key = v.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    // Sanitize key features: trim, remove empty, limit length
    if (this.isModified('keyFeatures')) {
        this.keyFeatures = sanitizeArray(this.keyFeatures, 150);
    }

    // Sanitize sizes/colors
    if (this.isModified('sizes')) {
        this.sizes = sanitizeArray(this.sizes, 50);
    }
    if (this.isModified('colors')) {
        this.colors = sanitizeArray(this.colors, 50);
    }

    // Sanitize variants
    if (this.isModified('variants')) {
        if (!Array.isArray(this.variants)) {
            this.variants = [];
        } else {
            this.variants = this.variants.map(v => ({
                size: typeof v.size === 'string' ? v.size.trim() : '',
                color: typeof v.color === 'string' ? v.color.trim() : '',
                quantity: Number.isFinite(Number(v.quantity)) ? Number(v.quantity) : 0,
                price: Number.isFinite(Number(v.price)) ? Number(v.price) : 0
            }));
        }
    }

    // Ensure images array has at least one image (backward compatibility)
    if (this.isModified('images') && this.images) {
        // If images array is empty but image field exists, use it
        if (this.images.length === 0 && this.image) {
            this.images = [this.image];
        }
        // Ensure minimum 1 image
        if (this.images.length === 0) {
            throw new Error('At least one product image is required');
        }
        // Ensure maximum 6 images
        if (this.images.length > 6) {
            throw new Error('Maximum 6 images allowed per product');
        }
    }
});

// Also handle slug generation on update
productSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate();
    if (update && (update.name || (update.$set && update.$set.name))) {
        const name = update.name || (update.$set && update.$set.name);
        if (name) {
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            
            if (!update.$set) {
                update.$set = {};
            }
            update.$set.slug = slug;
        }
    }
});

module.exports = mongoose.model('Product', productSchema);

