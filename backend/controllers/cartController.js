const Cart = require('../models/Cart');

const normalizeKey = (item) => {
  const size = item.size || '';
  const color = item.color || '';
  return `${item.product.toString()}|${size}|${color}`;
};

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    return res.status(200).json({ success: true, data: cart ? cart.items : [] });
  } catch (err) {
    console.error('Get cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/cart (replace all items)
exports.replaceCart = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const cart = await Cart.findOneAndUpdate(
      { user: req.userId },
      { $set: { items } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ success: true, data: cart.items });
  } catch (err) {
    console.error('Replace cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/cart/item (add or merge one item)
exports.addItem = async (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || !incoming.product || !incoming.quantity) {
      return res.status(400).json({ success: false, message: 'Invalid item payload' });
    }
    const clampQty = (item) => {
      const maxStock = item.variantStock ?? item.availableStock ?? Infinity;
      return Math.max(1, Math.min(item.quantity, maxStock));
    };

    const cart = await Cart.findOne({ user: req.userId }) || new Cart({ user: req.userId, items: [] });
    const key = normalizeKey(incoming);
    const map = new Map(cart.items.map((it) => [normalizeKey(it), it]));
    const existing = map.get(key);
    if (existing) {
      existing.quantity = clampQty({ ...existing, quantity: existing.quantity + incoming.quantity });
      map.set(key, existing);
    } else {
      map.set(key, { ...incoming, quantity: clampQty(incoming) });
    }
    cart.items = Array.from(map.values());
    await cart.save();
    return res.status(200).json({ success: true, data: cart.items });
  } catch (err) {
    console.error('Add cart item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/cart/item (update quantity)
exports.updateItem = async (req, res) => {
  try {
    const { product, size = '', color = '', quantity } = req.body || {};
    if (!product || !quantity) {
      return res.status(400).json({ success: false, message: 'Invalid item payload' });
    }
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(200).json({ success: true, data: [] });
    }
    cart.items = cart.items.map((it) => {
      if (normalizeKey(it) === normalizeKey({ product, size, color })) {
        const maxStock = it.variantStock ?? it.availableStock ?? Infinity;
        const nextQty = Math.max(1, Math.min(quantity, maxStock));
        return { ...it.toObject?.() || it, quantity: nextQty };
      }
      return it;
    });
    await cart.save();
    return res.status(200).json({ success: true, data: cart.items });
  } catch (err) {
    console.error('Update cart item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/cart/item/:productId
exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size = '', color = '' } = req.body || {};
    if (!productId) {
      return res.status(400).json({ success: false, message: 'ProductId required' });
    }
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(200).json({ success: true, data: [] });
    }
    cart.items = cart.items.filter((it) => normalizeKey(it) !== normalizeKey({ product: productId, size, color }));
    await cart.save();
    return res.status(200).json({ success: true, data: cart.items });
  } catch (err) {
    console.error('Remove cart item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

