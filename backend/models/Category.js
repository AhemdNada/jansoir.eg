const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters'],
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    image: {
        type: String,
        required: [true, 'Category image is required']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    productsCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Auto-generate slug from name before saving
categorySchema.pre('save', async function () {
    if (this.isModified('name') && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});

// Also handle slug generation on update
categorySchema.pre('findOneAndUpdate', async function () {
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

module.exports = mongoose.model('Category', categorySchema);
