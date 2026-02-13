const Shipping = require('../models/Shipping');

// Public: GET /api/shipping
// Admin:  GET /api/shipping (same)
exports.getShipping = async (req, res) => {
  const list = await Shipping.find().sort({ nameKey: 1 });
  res.status(200).json({ success: true, data: list });
};

// Admin: POST /api/shipping
exports.createShipping = async (req, res) => {
  const { name, shippingPrice } = req.body || {};
  const price = Number(shippingPrice);
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400);
    throw new Error('Governorate name is required');
  }
  if (Number.isNaN(price) || price < 0) {
    res.status(400);
    throw new Error('Shipping price must be a non-negative number');
  }

  const doc = await Shipping.create({ name: name.trim(), shippingPrice: price });
  res.status(201).json({ success: true, data: doc });
};

// Admin: PUT /api/shipping/:id
exports.updateShipping = async (req, res) => {
  const { id } = req.params;
  const { name, shippingPrice } = req.body || {};
  const update = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400);
      throw new Error('Governorate name cannot be empty');
    }
    update.name = name.trim();
  }

  if (shippingPrice !== undefined) {
    const price = Number(shippingPrice);
    if (Number.isNaN(price) || price < 0) {
      res.status(400);
      throw new Error('Shipping price must be a non-negative number');
    }
    update.shippingPrice = price;
  }

  const doc = await Shipping.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  if (!doc) {
    res.status(404);
    throw new Error('Shipping governorate not found');
  }
  res.status(200).json({ success: true, data: doc });
};

// Admin: PUT /api/shipping/bulk
// Body: { updates: [{ id, shippingPrice }] }
exports.bulkUpdateShipping = async (req, res) => {
  const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
  if (updates.length === 0) {
    res.status(400);
    throw new Error('updates array is required');
  }

  const cleaned = updates.map((u) => ({
    id: u?.id,
    shippingPrice: u?.shippingPrice,
  }));

  const invalid = cleaned.filter((u) => !u.id || Number.isNaN(Number(u.shippingPrice)) || Number(u.shippingPrice) < 0);
  if (invalid.length > 0) {
    res.status(400);
    throw new Error('Each update must include a valid id and a non-negative shippingPrice');
  }

  const ids = [...new Set(cleaned.map((u) => String(u.id)))];
  const existing = await Shipping.find({ _id: { $in: ids } }, { _id: 1 }).lean();
  const existingIds = new Set((existing || []).map((d) => String(d._id)));
  const missing = ids.filter((id) => !existingIds.has(String(id)));
  if (missing.length > 0) {
    res.status(400);
    throw new Error(`Some governorates were not found: ${missing.join(', ')}`);
  }

  const ops = cleaned.map((u) => ({
    updateOne: {
      filter: { _id: u.id },
      update: { $set: { shippingPrice: Number(u.shippingPrice) } },
    },
  }));

  await Shipping.bulkWrite(ops, { ordered: false });
  const updatedDocs = await Shipping.find({ _id: { $in: ids } }).sort({ nameKey: 1 });

  res.status(200).json({
    success: true,
    data: updatedDocs,
  });
};

