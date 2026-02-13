const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for product images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// Multiple images upload (max 6)
const uploadMultiple = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 6 // Maximum 6 files
    },
    fileFilter: fileFilter
});

const {
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
} = require('../controllers/productController');

const { protect, admin } = require('../middleware/authMiddleware');

// Public routes - specific routes first
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/category/:categorySlug', getProductsByCategory);

// Admin routes - creation and management
router.post('/', protect, admin, upload.single('image'), createProduct);

// Image management routes - must come before PUT /:id (more specific routes first)
router.put('/:id/images', protect, admin, uploadMultiple.array('images', 6), addProductImages);
router.delete('/:id/images/:imageIndex', protect, admin, deleteProductImage);

// Key features management route - must come before PUT /:id
router.put('/:id/key-features', protect, admin, updateKeyFeatures);

// General routes - must come last
router.get('/:id', getProduct);
router.put('/:id', protect, admin, upload.single('image'), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);





module.exports = router;
