const Shipping = require('../models/Shipping');

// One-time initializer to ensure all governorates exist in MongoDB.
// This is used only to bootstrap the DB so the UI can fetch the list from MongoDB.
const EGYPT_GOVERNORATES = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Qalyubia',
  'Port Said',
  'Suez',
  'Dakahlia',
  'Sharqia',
  'Gharbia',
  'Monufia',
  'Beheira',
  'Kafr El Sheikh',
  'Damietta',
  'Ismailia',
  'Faiyum',
  'Beni Suef',
  'Minya',
  'Asyut',
  'Sohag',
  'Qena',
  'Luxor',
  'Aswan',
  'Red Sea',
  'New Valley',
  'Matrouh',
  'North Sinai',
  'South Sinai',
];

const normalizeKey = (name) => String(name || '').replace(/\s+/g, ' ').trim().toLowerCase();

async function ensureShippingGovernorates() {
  const existing = await Shipping.find({}, { nameKey: 1 }).lean();
  const existingKeys = new Set((existing || []).map((d) => d.nameKey));

  const toInsert = EGYPT_GOVERNORATES
    .map((name) => ({ name, nameKey: normalizeKey(name), shippingPrice: 0 }))
    .filter((doc) => doc.nameKey && !existingKeys.has(doc.nameKey));

  if (toInsert.length > 0) {
    await Shipping.insertMany(toInsert, { ordered: false });
  }
}

module.exports = { ensureShippingGovernorates };

