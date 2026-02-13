const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getOverview,
  getTopProducts,
  clearAllAnalytics,
  deleteAnalyticsByRange,
} = require('../controllers/adminAnalyticsController');

router.get('/overview', protect, admin, getOverview);
router.get('/top-products', protect, admin, getTopProducts);

router.delete('/clear', protect, admin, clearAllAnalytics);
router.delete('/', protect, admin, deleteAnalyticsByRange);

module.exports = router;

