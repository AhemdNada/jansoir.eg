const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const customizeUpload = require('../middleware/customizeUpload');
const {
    submitCustomizeRequest,
    getMyCustomizeRequests,
    getCustomizeRequest,
    getAllCustomizeRequests,
    deleteCustomizeRequest
} = require('../controllers/customizeController');

// All routes require authentication
router.use(protect);

// Submit customize request
router.post(
    '/',
    customizeUpload.single('photo'),
    submitCustomizeRequest
);

// Get user's customize requests
router.get('/my-requests', getMyCustomizeRequests);

// Get single customize request
router.get('/:id', getCustomizeRequest);

module.exports = router;

