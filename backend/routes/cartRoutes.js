const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

router.use(protect);

router.get('/', cartController.getCart);
router.put('/', cartController.replaceCart);
router.post('/item', cartController.addItem);
router.patch('/item', cartController.updateItem);
router.delete('/item/:productId', cartController.removeItem);

module.exports = router;

