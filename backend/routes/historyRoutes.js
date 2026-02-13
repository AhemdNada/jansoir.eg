const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getHistory, clearAllHistory } = require('../controllers/historyController');

// Admin-only history listing with pagination/filter/search
router.get('/', protect, admin, getHistory);

// Admin-only clear all history
router.delete('/', protect, admin, clearAllHistory);

module.exports = router;


