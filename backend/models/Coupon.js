const mongoose = require('mongoose');

const normalizeCode = (code) => {
  if (typeof code !== 'string') return { code: '', key: '' };
  const cleaned = code.replace(/\s+/g, '').trim();
  return { code: cleaned.toUpperCase(), key: cleaned.toLowerCase() };
};

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    codeKey: { type: String, required: true, trim: true, lowercase: true, unique: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.pre('validate', function () {
  const { code, key } = normalizeCode(this.code);
  this.code = code;
  this.codeKey = key;
});

couponSchema.pre('validate', function () {
  if (this.type === 'percentage' && Number(this.value) > 100) {
    this.invalidate('value', 'Percentage discount cannot exceed 100');
  }
});

module.exports = mongoose.model('Coupon', couponSchema);

