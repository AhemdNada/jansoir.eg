const roundMoney = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round((x + Number.EPSILON) * 100) / 100;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const computeDiscountAmount = ({ subtotal, type, value }) => {
  const sub = roundMoney(subtotal);
  const val = Number(value);
  if (!Number.isFinite(sub) || sub <= 0) return 0;
  if (!Number.isFinite(val) || val <= 0) return 0;

  let discount = 0;
  if (type === 'percentage') {
    // value is 0..100
    discount = (sub * val) / 100;
  } else if (type === 'fixed') {
    discount = val;
  } else {
    discount = 0;
  }

  discount = roundMoney(discount);
  return clamp(discount, 0, sub);
};

const computeTotals = ({ subtotal, shippingPrice, discountAmount }) => {
  const sub = roundMoney(subtotal);
  const ship = roundMoney(shippingPrice);
  const disc = clamp(roundMoney(discountAmount), 0, sub);
  const total = roundMoney(Math.max(0, sub - disc));
  const totalWithShipping = roundMoney(Math.max(0, total + ship));
  return { subtotal: sub, shippingPrice: ship, discountAmount: disc, total, totalWithShipping };
};

module.exports = {
  roundMoney,
  computeDiscountAmount,
  computeTotals,
};

