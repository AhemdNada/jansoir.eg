const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllCustomizeRequests,
    deleteCustomizeRequest
} = require('../controllers/customizeController');

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Get all customize requests
router.get('/', getAllCustomizeRequests);

// Delete customize request
router.delete('/:id', deleteCustomizeRequest);

module.exports = router;

