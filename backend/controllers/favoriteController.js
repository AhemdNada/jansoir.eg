const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

// Add product to favorites (idempotent)
exports.addFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!req.userId) {
      return res.status(403).json({ success: false, message: 'User authentication required' });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId).select('_id status');
    if (!product || product.status === 'Inactive') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { user: req.userId, product: productId },
      { $setOnInsert: { user: req.userId, product: productId } },
      { new: true, upsert: true }
    );

    const populated = await favorite.populate({
      path: 'product',
      select: 'name price originalPrice rating stock image images status category brand',
    });

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get current user's favorites
exports.getFavorites = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(403).json({ success: false, message: 'User authentication required' });
    }
    const favorites = await Favorite.find({ user: req.userId })
      .populate({
        path: 'product',
        select: 'name price originalPrice rating stock image images status category brand',
      })
      .sort({ createdAt: -1 })
      .lean();

    // filter out removed products
    const sanitized = favorites.filter(f => f.product && f.product.status === 'Active');

    return res.status(200).json({ success: true, data: sanitized });
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Remove product from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!req.userId) {
      return res.status(403).json({ success: false, message: 'User authentication required' });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    await Favorite.findOneAndDelete({ user: req.userId, product: productId });

    return res.status(200).json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

