const Coupon = require('../models/Coupon');
const { computeDiscountAmount, computeTotals } = require('../utils/pricing');

const normalizeCodeKey = (code) => String(code || '').replace(/\s+/g, '').trim().toLowerCase();

// Admin: GET /api/coupons
exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: coupons });
};

// Public: POST /api/coupons/validate
exports.validateCoupon = async (req, res) => {
  const { code, subtotal } = req.body || {};
  const codeKey = normalizeCodeKey(code);
  const sub = Number(subtotal);

  if (!codeKey) {
    res.status(400);
    throw new Error('Coupon code is required');
  }
  if (Number.isNaN(sub) || sub < 0) {
    res.status(400);
    throw new Error('Subtotal must be a non-negative number');
  }

  const coupon = await Coupon.findOne({ codeKey, isActive: true });
  if (!coupon) {
    res.status(404);
    throw new Error('Invalid or inactive coupon code');
  }

  const discountAmount = computeDiscountAmount({ subtotal: sub, type: coupon.type, value: coupon.value });
  const totals = computeTotals({ subtotal: sub, shippingPrice: 0, discountAmount });

  res.status(200).json({
    success: true,
    data: {
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      discountAmount,
      totalAfterDiscount: totals.total,
    },
  });
};

// Admin: POST /api/coupons
exports.createCoupon = async (req, res) => {
  const { code, type, value, isActive } = req.body || {};
  const v = Number(value);

  if (!code || typeof code !== 'string' || !code.trim()) {
    res.status(400);
    throw new Error('Coupon code is required');
  }
  if (!['percentage', 'fixed'].includes(type)) {
    res.status(400);
    throw new Error('Coupon type must be percentage or fixed');
  }
  if (Number.isNaN(v) || v < 0) {
    res.status(400);
    throw new Error('Coupon value must be a non-negative number');
  }
  if (type === 'percentage' && v > 100) {
    res.status(400);
    throw new Error('Percentage discount cannot exceed 100');
  }

  const doc = await Coupon.create({
    code: code.trim(),
    type,
    value: v,
    isActive: isActive !== undefined ? !!isActive : true,
  });

  res.status(201).json({ success: true, data: doc });
};

// Admin: PUT /api/coupons/:id
exports.updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, type, value, isActive } = req.body || {};

  const update = {};
  if (code !== undefined) {
    if (typeof code !== 'string' || !code.trim()) {
      res.status(400);
      throw new Error('Coupon code cannot be empty');
    }
    update.code = code.trim();
  }
  if (type !== undefined) {
    if (!['percentage', 'fixed'].includes(type)) {
      res.status(400);
      throw new Error('Coupon type must be percentage or fixed');
    }
    update.type = type;
  }
  if (value !== undefined) {
    const v = Number(value);
    if (Number.isNaN(v) || v < 0) {
      res.status(400);
      throw new Error('Coupon value must be a non-negative number');
    }
    update.value = v;
  }
  if (isActive !== undefined) {
    update.isActive = !!isActive;
  }

  // Validate percentage cap if both/one fields change
  const existing = await Coupon.findById(id);
  if (!existing) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  const nextType = update.type !== undefined ? update.type : existing.type;
  const nextValue = update.value !== undefined ? update.value : existing.value;
  if (nextType === 'percentage' && Number(nextValue) > 100) {
    res.status(400);
    throw new Error('Percentage discount cannot exceed 100');
  }

  Object.assign(existing, update);
  await existing.save();

  res.status(200).json({ success: true, data: existing });
};

// Admin: DELETE /api/coupons/:id
exports.deleteCoupon = async (req, res) => {
  const { id } = req.params;
  const existing = await Coupon.findById(id);
  if (!existing) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  await existing.deleteOne();
  res.status(200).json({ success: true, message: 'Coupon deleted' });
};

