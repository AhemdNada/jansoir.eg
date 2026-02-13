const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { createSlug, getActiveCategorySlugs } = require('../utils/helpers');
const { logActivity } = require('../utils/activityLogger');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res) => {
    try {
        const { category, status, search, limit, page } = req.query;
        let query = {};

        // Get active category slugs to filter products
        const activeCategorySlugs = await getActiveCategorySlugs(Category);
        
        // For public access (no auth), always filter by active categories and active products
        // Admin users can see all products via status filter
        const isPublicAccess = !req.userId;
        
        if (isPublicAccess) {
            // Public: only show products from active categories
            query.category = { $in: activeCategorySlugs };
            // Public: always show only active products (ignore status parameter)
            query.status = 'Active';
        } else {
            // Admin access: use status filter if provided, otherwise default to active
            if (status) {
                query.status = status;
            } else {
                query.status = 'Active';
            }
        }

        // Filter by category (if specified)
        if (category) {
            // Verify the category is active for public access
            if (isPublicAccess && !activeCategorySlugs.includes(category)) {
                // Category is inactive, return empty results
                return res.status(200).json({
                    success: true,
                    count: 0,
                    total: 0,
                    page: 1,
                    totalPages: 0,
                    data: []
                });
            }
            query.category = category;
        }

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 100;
        const skip = (pageNum - 1) * limitNum;

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalProducts = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            count: products.length,
            total: totalProducts,
            page: pageNum,
            totalPages: Math.ceil(totalProducts / limitNum),
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching products'
        });
    }
};

// @desc    Search products (public)
// @route   GET /api/products/search
const searchProducts = async (req, res) => {
    try {
        const rawQuery = req.query.q || req.query.search || '';
        const trimmedQuery = String(rawQuery).trim().slice(0, 80);
        const limitNum = Math.min(Math.max(parseInt(req.query.limit) || 8, 1), 20);

        if (!trimmedQuery || trimmedQuery.length < 2) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        const isPublicAccess = !req.userId;
        const query = {};

        if (isPublicAccess) {
            const activeCategorySlugs = await getActiveCategorySlugs(Category);
            if (activeCategorySlugs.length === 0) {
                return res.status(200).json({
                    success: true,
                    count: 0,
                    data: []
                });
            }
            query.category = { $in: activeCategorySlugs };
            query.status = 'Active';
        } else {
            query.status = req.query.status || 'Active';
        }

        const safeQuery = escapeRegex(trimmedQuery);
        query.$or = [
            { name: { $regex: safeQuery, $options: 'i' } },
            { description: { $regex: safeQuery, $options: 'i' } },
            { keyFeatures: { $regex: safeQuery, $options: 'i' } },
            { brand: { $regex: safeQuery, $options: 'i' } }
        ];

        const products = await Product.find(query)
            .select('name price image category slug discount rating')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .lean();

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while searching products'
        });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // For public access, check if product's category is active
        const isPublicAccess = !req.userId;
        if (isPublicAccess) {
            // Check if product is active
            if (product.status !== 'Active') {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if category is active
            const category = await Category.findOne({ 
                slug: product.category,
                status: 'Active'
            });

            if (!category) {
                // Category is inactive or doesn't exist - hide product from public
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching product'
        });
    }
};

// @desc    Create new product
// @route   POST /api/products
const createProduct = async (req, res) => {
    try {
        let {
            name,
            description,
            price,
            originalPrice,
            category,
            brand,
            status,
            rating,
            keyFeatures,
            sizes,
            colors,
            variants
        } = req.body;

        // Parse keyFeatures if it's a JSON string (from FormData)
        if (keyFeatures !== undefined && typeof keyFeatures === 'string') {
            try {
                if (keyFeatures.trim() === '') {
                    // Empty string means no features
                    keyFeatures = [];
                } else {
                    keyFeatures = JSON.parse(keyFeatures);
                }
            } catch (err) {
                // If parsing fails, treat as empty array
                keyFeatures = [];
            }
        }

        // Validation
        if (!name || !name.trim()) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Product name is required'
            });
        }

        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Valid product price is required'
            });
        }

        if (!category || !category.trim()) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Product category is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Product image is required'
            });
        }

        // Calculate discount percentage if original price is provided
        let discount = 0;
        const priceNum = parseFloat(price);
        const originalPriceNum = originalPrice ? parseFloat(originalPrice) : priceNum;
        
        if (originalPriceNum > priceNum) {
            discount = Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100);
        }

        // Rename file with category and product name
        const categorySlug = createSlug(category.trim());
        const productSlug = createSlug(name.trim());
        const fileExt = path.extname(req.file.filename);
        const newFileName = `${categorySlug}-${productSlug}${fileExt}`;
        const newFilePath = path.join(path.dirname(req.file.path), newFileName);
        
        // Rename the file
        fs.renameSync(req.file.path, newFilePath);

        // Parse arrays if sent as JSON strings
        const parseArray = (val) => {
            if (val === undefined) return undefined;
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed;
                } catch (err) { return []; }
            }
            return [];
        };

        sizes = parseArray(sizes);
        colors = parseArray(colors);
        const rawVariants = parseArray(variants);
        const fallbackVariantPrice = priceNum;
        variants = rawVariants.map(v => {
            const hasPrice = v && v.price !== undefined && v.price !== null && v.price !== '';
            const priceValue = hasPrice ? Number(v.price) : fallbackVariantPrice;
            const quantityValue = Number(v && v.quantity);
            return {
                size: v && v.size !== undefined ? String(v.size || '').trim() : '',
                color: v && v.color !== undefined ? String(v.color || '').trim() : '',
                quantity: Number.isFinite(quantityValue) ? quantityValue : NaN,
                price: Number.isFinite(priceValue) ? priceValue : NaN
            };
        });
        const invalidVariant = variants.find(v => (
            !Number.isFinite(v.quantity) || v.quantity < 0 ||
            !Number.isFinite(v.price) || v.price <= 0
        ));
        if (invalidVariant) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Each variant must include price > 0 and quantity >= 0'
            });
        }

        // Sanitize key features if provided
        let sanitizedKeyFeatures = [];
        if (keyFeatures !== undefined && Array.isArray(keyFeatures) && keyFeatures.length > 0) {
            sanitizedKeyFeatures = keyFeatures
                .map(feature => {
                    if (typeof feature !== 'string') return null;
                    let sanitized = feature.trim().replace(/\s+/g, ' ');
                    if (sanitized.length > 150) {
                        sanitized = sanitized.substring(0, 150).trim();
                    }
                    return sanitized.length > 0 ? sanitized : null;
                })
                .filter(feature => feature !== null);
            
            // Check for duplicates
            const lowerFeatures = sanitizedKeyFeatures.map(f => f.toLowerCase());
            const uniqueFeatures = new Set(lowerFeatures);
            if (uniqueFeatures.size !== sanitizedKeyFeatures.length) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Duplicate key features are not allowed'
                });
            }
            
            // Check maximum limit
            if (sanitizedKeyFeatures.length > 10) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 10 key features allowed'
                });
            }
        }

        // Create new product
        const productData = {
            name: name.trim(),
            description: description || '',
            price: priceNum,
            originalPrice: originalPriceNum,
            discount: discount,
            category: category.trim(),
            brand: brand || '',
            status: status || 'Active',
            rating: parseFloat(rating) || 0,
            image: `/uploads/products/${newFileName}`,
            images: [`/uploads/products/${newFileName}`],
            keyFeatures: sanitizedKeyFeatures,
            sizes: sizes ? sizes.filter(s => typeof s === 'string' && s.trim().length > 0).map(s => s.trim()) : [],
            colors: colors ? colors.filter(c => typeof c === 'string' && c.trim().length > 0).map(c => c.trim()) : [],
            variants
        };

        const newProduct = await Product.create(productData);

        logActivity({
            type: 'product',
            action: 'Product created',
            details: `Product "${newProduct.name}" created in category ${newProduct.category}`,
            entityType: 'product',
            entityId: newProduct._id,
            severity: 'info'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });
    } catch (error) {
        console.error('Error creating product:', error);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating product'
        });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        let {
            name,
            description,
            price,
            originalPrice,
            category,
            brand,
            status,
            rating,
            keyFeatures,
            sizes,
            colors,
            variants
        } = req.body;

        const parseArray = (val) => {
            if (val === undefined) return undefined;
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed;
                } catch (err) { return []; }
            }
            return [];
        };

        // Parse keyFeatures if it's a JSON string (from FormData)
        keyFeatures = keyFeatures !== undefined ? parseArray(keyFeatures) : undefined;
        sizes = sizes !== undefined ? parseArray(sizes) : undefined;
        colors = colors !== undefined ? parseArray(colors) : undefined;
        variants = variants !== undefined ? parseArray(variants) : undefined;

        const product = await Product.findById(req.params.id);

        if (!product) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Validation
        if (name !== undefined && !name.trim()) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Product name cannot be empty'
            });
        }

        if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Valid product price is required'
            });
        }

        // Update fields
        if (name) product.name = name.trim();
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = parseFloat(price);
        if (originalPrice !== undefined) product.originalPrice = parseFloat(originalPrice);
        if (category) product.category = category.trim();
        if (brand !== undefined) product.brand = brand;
        if (status) product.status = status;
        if (rating !== undefined) product.rating = parseFloat(rating) || 0;

        // Recalculate discount
        if (product.originalPrice > product.price) {
            product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        } else {
            product.discount = 0;
        }

        // Handle key features update
        if (keyFeatures !== undefined) {
            if (!Array.isArray(keyFeatures)) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Key features must be an array'
                });
            }

            // Sanitize and validate
            const sanitizedFeatures = keyFeatures
                .map(feature => {
                    if (typeof feature !== 'string') return null;
                    let sanitized = feature.trim().replace(/\s+/g, ' ');
                    if (sanitized.length > 150) {
                        sanitized = sanitized.substring(0, 150).trim();
                    }
                    return sanitized.length > 0 ? sanitized : null;
                })
                .filter(feature => feature !== null);

            // Check for duplicates
            const lowerFeatures = sanitizedFeatures.map(f => f.toLowerCase());
            const uniqueFeatures = new Set(lowerFeatures);
            if (uniqueFeatures.size !== sanitizedFeatures.length) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Duplicate key features are not allowed'
                });
            }

            // Check maximum limit
            if (sanitizedFeatures.length > 10) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 10 key features allowed'
                });
            }

            product.keyFeatures = sanitizedFeatures;
        }

        // Handle sizes/colors
        const sanitizeArray = (arr) => {
            if (!Array.isArray(arr)) return [];
            const cleaned = arr
                .map(v => typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '')
                .filter(v => v.length > 0 && v.length <= 50);
            const seen = new Set();
            return cleaned.filter(v => {
                const key = v.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        };
        if (sizes !== undefined) {
            product.sizes = sanitizeArray(sizes);
        }
        if (colors !== undefined) {
            product.colors = sanitizeArray(colors);
        }
        if (variants !== undefined) {
            const fallbackVariantPrice = price !== undefined ? parseFloat(price) : product.price;
            const normalizedVariants = variants.map(v => {
                const hasPrice = v && v.price !== undefined && v.price !== null && v.price !== '';
                const priceValue = hasPrice ? Number(v.price) : fallbackVariantPrice;
                const quantityValue = Number(v && v.quantity);
                return {
                    size: v && v.size !== undefined ? String(v.size || '').trim() : '',
                    color: v && v.color !== undefined ? String(v.color || '').trim() : '',
                    quantity: Number.isFinite(quantityValue) ? quantityValue : NaN,
                    price: Number.isFinite(priceValue) ? priceValue : NaN
                };
            });
            const invalidVariant = normalizedVariants.find(v => (
                !Number.isFinite(v.quantity) || v.quantity < 0 ||
                !Number.isFinite(v.price) || v.price <= 0
            ));
            if (invalidVariant) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Each variant must include price > 0 and quantity >= 0'
                });
            }
            product.variants = normalizedVariants;
        }

        // Handle image update
        if (req.file) {
            // Delete old image
            if (product.image) {
                const oldImagePath = path.join(__dirname, '..', product.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            // Rename file with category and product name
            const categoryName = category ? category.trim() : product.category;
            const productName = name ? name.trim() : product.name;
            const categorySlug = createSlug(categoryName);
            const productSlug = createSlug(productName);
            const fileExt = path.extname(req.file.filename);
            const newFileName = `${categorySlug}-${productSlug}${fileExt}`;
            const newFilePath = path.join(path.dirname(req.file.path), newFileName);
            
            // Rename the file
            fs.renameSync(req.file.path, newFilePath);
            product.image = `/uploads/products/${newFileName}`;
            product.images = [`/uploads/products/${newFileName}`];
        }

        const updatedProduct = await product.save();

        logActivity({
            type: 'product',
            action: 'Product updated',
            details: `Product "${product.name}" updated`,
            entityType: 'product',
            entityId: product._id,
            severity: 'info'
        }, { adminId: req.adminId, userId: req.userId });

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating product'
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete all product images
        if (product.images && product.images.length > 0) {
            product.images.forEach(imagePath => {
                const fullPath = path.join(__dirname, '..', imagePath);
                if (fs.existsSync(fullPath)) {
                    try {
                        fs.unlinkSync(fullPath);
                    } catch (err) {
                        console.error(`Error deleting image ${imagePath}:`, err);
                    }
                }
            });
        } else if (product.image) {
            // Fallback for old products with single image
            const imagePath = path.join(__dirname, '..', product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const deleteResult = await Product.deleteOne({ _id: req.params.id });

        if (!deleteResult || deleteResult.deletedCount !== 1) {
            return res.status(500).json({
                success: false,
                message: 'Product could not be deleted'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });

        logActivity({
            type: 'product',
            action: 'Product deleted',
            details: `Product "${product.name}" deleted`,
            entityType: 'product',
            entityId: product._id,
            severity: 'warning'
        }, { adminId: req.adminId, userId: req.userId });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting product'
        });
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categorySlug
const getProductsByCategory = async (req, res) => {
    try {
        const categorySlug = req.params.categorySlug;
        
        // Verify category exists and is active
        const category = await Category.findOne({ 
            slug: categorySlug,
            status: 'Active'
        });

        if (!category) {
            // Category doesn't exist or is inactive
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        // Get products from this active category
        const products = await Product.find({
            category: categorySlug,
            status: 'Active'
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching products'
        });
    }
};

// @desc    Add images to product
// @route   PUT /api/products/:id/images
const addProductImages = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            // Clean up uploaded files if product not found
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image is required'
            });
        }

        // Check if adding these images would exceed the limit
        const currentImageCount = product.images ? product.images.length : 0;
        const newImageCount = req.files.length;
        
        if (currentImageCount + newImageCount > 6) {
            // Clean up uploaded files
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
            return res.status(400).json({
                success: false,
                message: `Maximum 6 images allowed. Currently have ${currentImageCount}, trying to add ${newImageCount}. Maximum allowed: ${6 - currentImageCount}`
            });
        }

        // Process and rename uploaded files
        const newImages = [];
        const categorySlug = createSlug(product.category);
        const productSlug = createSlug(product.name);

        req.files.forEach((file, index) => {
            const fileExt = path.extname(file.filename);
            const newFileName = `${categorySlug}-${productSlug}-${Date.now()}-${index}${fileExt}`;
            const newFilePath = path.join(path.dirname(file.path), newFileName);
            
            // Rename the file
            fs.renameSync(file.path, newFilePath);
            newImages.push(`/uploads/products/${newFileName}`);
        });

        // Add new images to existing images array
        if (!product.images || product.images.length === 0) {
            product.images = newImages;
            // Update main image if it's empty
            if (!product.image) {
                product.image = newImages[0];
            }
        } else {
            product.images = [...product.images, ...newImages];
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Images added successfully',
            data: product
        });
    } catch (error) {
        console.error('Error adding product images:', error);
        // Clean up uploaded files on error
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (err) {
                        console.error(`Error cleaning up file ${file.path}:`, err);
                    }
                }
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while adding images'
        });
    }
};

// @desc    Delete product image by index
// @route   DELETE /api/products/:id/images/:imageIndex
const deleteProductImage = async (req, res) => {
    try {
        const { id, imageIndex } = req.params;
        const index = parseInt(imageIndex);

        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image index'
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Ensure images array exists and has items
        if (!product.images || product.images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Product has no images'
            });
        }

        // Check if index is valid
        if (index >= product.images.length) {
            return res.status(400).json({
                success: false,
                message: 'Image index out of range'
            });
        }

        // Prevent deleting the last image
        if (product.images.length === 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the last image. At least one image is required.'
            });
        }

        // Get the image path to delete
        const imageToDelete = product.images[index];
        const imagePath = path.join(__dirname, '..', imageToDelete);

        // Delete the physical file
        if (fs.existsSync(imagePath)) {
            try {
                fs.unlinkSync(imagePath);
            } catch (err) {
                console.error(`Error deleting image file ${imagePath}:`, err);
            }
        }

        // Remove image from array
        product.images.splice(index, 1);

        // Update main image if it was the deleted one
        if (product.image === imageToDelete && product.images.length > 0) {
            product.image = product.images[0]; // Set first image as primary
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully',
            data: product
        });
    } catch (error) {
        console.error('Error deleting product image:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while deleting image'
        });
    }
};

// @desc    Update product key features
// @route   PUT /api/products/:id/key-features
const updateKeyFeatures = async (req, res) => {
    try {
        const { keyFeatures } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Validate keyFeatures
        if (!Array.isArray(keyFeatures)) {
            return res.status(400).json({
                success: false,
                message: 'Key features must be an array'
            });
        }

        // Sanitize and validate each feature
        const sanitizedFeatures = keyFeatures
            .map(feature => {
                if (typeof feature !== 'string') {
                    return null;
                }
                // Trim and remove excessive whitespace
                let sanitized = feature.trim().replace(/\s+/g, ' ');
                // Limit to 150 characters
                if (sanitized.length > 150) {
                    sanitized = sanitized.substring(0, 150).trim();
                }
                return sanitized.length > 0 ? sanitized : null;
            })
            .filter(feature => feature !== null); // Remove null/empty features

        // Check for duplicates (case-insensitive)
        const lowerFeatures = sanitizedFeatures.map(f => f.toLowerCase());
        const uniqueFeatures = new Set(lowerFeatures);
        if (uniqueFeatures.size !== sanitizedFeatures.length) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate key features are not allowed'
            });
        }

        // Check maximum limit
        if (sanitizedFeatures.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 key features allowed'
            });
        }

        // Update key features
        product.keyFeatures = sanitizedFeatures;
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Key features updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Error updating key features:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating key features'
        });
    }
};


module.exports = {
    getProducts,
    searchProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    addProductImages,
    deleteProductImage,
    updateKeyFeatures
};
