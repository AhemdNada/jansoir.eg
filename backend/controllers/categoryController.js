const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { createSlug, getActiveCategorySlugs } = require('../utils/helpers');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        const categories = await Category.find(query).sort({ createdAt: -1 });

        // Calculate product counts for active categories
        const activeCategorySlugs = await getActiveCategorySlugs(Category);
        
        // Aggregate product counts by category slug
        const productCounts = await Product.aggregate([
            {
                $match: {
                    status: 'Active',
                    category: { $in: activeCategorySlugs }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map of category slug to count
        const countMap = {};
        productCounts.forEach(item => {
            countMap[item._id] = item.count;
        });

        // Add calculated product counts to categories
        const categoriesWithCounts = categories.map(category => {
            const categoryObj = category.toObject();
            // Only include count for active categories
            if (category.status === 'Active') {
                categoryObj.productsCount = countMap[category.slug] || 0;
            } else {
                categoryObj.productsCount = 0; // Inactive categories show 0
            }
            return categoryObj;
        });

        res.status(200).json({
            success: true,
            count: categoriesWithCounts.length,
            data: categoriesWithCounts
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching categories'
        });
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Calculate product count for this category
        let productsCount = 0;
        if (category.status === 'Active') {
            const count = await Product.countDocuments({
                status: 'Active',
                category: category.slug
            });
            productsCount = count;
        }

        const categoryObj = category.toObject();
        categoryObj.productsCount = productsCount;

        res.status(200).json({
            success: true,
            data: categoryObj
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching category'
        });
    }
};

// @desc    Create new category
// @route   POST /api/categories
const createCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        // Validation
        if (!name || !name.trim()) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        if (name.trim().length < 2) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Category name must be at least 2 characters'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Category image is required'
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });

        if (existingCategory) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        // Rename file with category name
        const categorySlug = createSlug(name.trim());
        const fileExt = path.extname(req.file.filename);
        const newFileName = `category-${categorySlug}${fileExt}`;
        const newFilePath = path.join(path.dirname(req.file.path), newFileName);
        
        // Rename the file
        fs.renameSync(req.file.path, newFilePath);

        // Create new category
        const categoryData = {
            name: name.trim(),
            description: description || '',
            status: status || 'Active',
            image: `/uploads/categories/${newFileName}`,
            productsCount: 0
        };

        const newCategory = await Category.create(categoryData);

        logActivity({
            type: 'product',
            action: 'Category created',
            details: `Category "${newCategory.name}" created`,
            entityType: 'category',
            entityId: newCategory._id,
            severity: 'info'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: newCategory
        });
    } catch (error) {
        console.error('Error creating category:', error);
        if (req.file) fs.unlinkSync(req.file.path);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating category'
        });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        // Validation
        if (name && !name.trim()) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Category name cannot be empty'
            });
        }

        const category = await Category.findById(req.params.id);

        if (!category) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check for duplicate name (excluding current category)
        if (name) {
            const existingCategory = await Category.findOne({
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
                _id: { $ne: req.params.id }
            });

            if (existingCategory) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name already exists'
                });
            }
        }

        // Update fields
        if (name) category.name = name.trim();
        if (description !== undefined) category.description = description;
        if (status) {
            category.status = status;
            // Note: When status changes to 'Inactive', products linked to this category
            // will automatically be hidden from public views because they won't match
            // any active category in the filter query.
        }

        // Handle image update
        if (req.file) {
            // Delete old image
            if (category.image) {
                const oldImagePath = path.join(__dirname, '..', category.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            // Rename file with category name
            const categoryName = name ? name.trim() : category.name;
            const categorySlug = createSlug(categoryName);
            const fileExt = path.extname(req.file.filename);
            const newFileName = `category-${categorySlug}${fileExt}`;
            const newFilePath = path.join(path.dirname(req.file.path), newFileName);
            
            // Rename the file
            fs.renameSync(req.file.path, newFilePath);
            category.image = `/uploads/categories/${newFileName}`;
        }

        const updatedCategory = await category.save();

        logActivity({
            type: 'product',
            action: 'Category updated',
            details: `Category "${category.name}" updated`,
            entityType: 'category',
            entityId: category._id,
            severity: 'info'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category:', error);
        if (req.file) fs.unlinkSync(req.file.path);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating category'
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Note: Products linked to this category will automatically be hidden
        // from public views because they won't match any active category.
        // Products remain in database but won't appear in public listings.

        // Delete category image
        if (category.image) {
            const imagePath = path.join(__dirname, '..', category.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const deleteResult = await Category.deleteOne({ _id: req.params.id });

        if (!deleteResult || deleteResult.deletedCount !== 1) {
            return res.status(500).json({
                success: false,
                message: 'Category could not be deleted'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully. Products linked to this category are now hidden from public views.'
        });

        logActivity({
            type: 'product',
            action: 'Category deleted',
            details: `Category "${category.name}" deleted`,
            entityType: 'category',
            entityId: category._id,
            severity: 'warning'
        }, { adminId: req.adminId, userId: req.userId });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting category'
        });
    }
};

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
