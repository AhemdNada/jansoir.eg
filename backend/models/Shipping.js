const mongoose = require('mongoose');

const normalizeGovernorate = (name) => {
  if (typeof name !== 'string') return { name: '', key: '' };
  const cleaned = name.replace(/\s+/g, ' ').trim();
  return { name: cleaned, key: cleaned.toLowerCase() };
};

const shippingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true, trim: true, lowercase: true, unique: true },
    shippingPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

shippingSchema.pre('validate', function () {
  const { name, key } = normalizeGovernorate(this.name);
  this.name = name;
  this.nameKey = key;
});

module.exports = mongoose.model('Shipping', shippingSchema);

