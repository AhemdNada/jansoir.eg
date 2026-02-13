const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const favoriteController = require('../controllers/favoriteController');

router.use(protect);

router.get('/', favoriteController.getFavorites);
router.post('/:productId', favoriteController.addFavorite);
router.delete('/:productId', favoriteController.removeFavorite);

module.exports = router;

