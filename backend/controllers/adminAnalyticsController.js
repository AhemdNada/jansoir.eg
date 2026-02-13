const AnalyticsEvent = require('../models/AnalyticsEvent');
const Order = require('../models/Order');
const { getDateRange } = require('../utils/analytics/dateRange');

/**
 * NOTE:
 * AnalyticsEvent storage is disabled (ingestion drops events).
 * This admin analytics controller therefore reports ONLY order-derived metrics.
 */

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function clampLimit(value, def = 10, min = 1, max = 50) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(n, min), max);
}

// GET /api/admin/analytics/overview?from=&to=
exports.getOverview = async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query, { defaultDays: 7 });

    const orderAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$totalWithShipping' },
        },
      },
    ]);

    const orders = safeNumber(orderAgg?.[0]?.orders);
    const revenue = safeNumber(orderAgg?.[0]?.revenue);
    const aov = orders > 0 ? revenue / orders : 0;

    return res.json({
      success: true,
      data: {
        range: { from, to },
        kpis: {
          revenue,
          orders,
          aov,
        },
      },
    });
  } catch (error) {
    console.error('Admin analytics overview error:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading analytics overview' });
  }
};

// GET /api/admin/analytics/top-products?from=&to=&limit=
exports.getTopProducts = async (req, res) => {
  try {
    const { from, to } = getDateRange(req.query, { defaultDays: 30 });
    const limit = clampLimit(req.query.limit, 10, 1, 30);

    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          units: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ]);

    const labels = rows.map(r => String(r.name || 'Unknown').slice(0, 40));
    const revenue = rows.map(r => safeNumber(r.revenue));
    const units = rows.map(r => safeNumber(r.units));

    return res.json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenue,
            backgroundColor: 'rgba(212, 175, 55, 0.75)',
            borderColor: 'rgba(212, 175, 55, 1)',
            borderWidth: 1,
          },
          {
            label: 'Units',
            data: units,
            backgroundColor: 'rgba(231, 215, 190, 0.45)',
            borderColor: 'rgba(231, 215, 190, 0.9)',
            borderWidth: 1,
          },
        ],
      },
    });
  } catch (error) {
    console.error('Admin analytics top products error:', error);
    return res.status(500).json({ success: false, message: 'Server error while loading top products' });
  }
};

// GET /api/admin/analytics/errors?from=&to=
// DELETE /api/admin/analytics/clear
exports.clearAllAnalytics = async (req, res) => {
  try {
    const result = await AnalyticsEvent.deleteMany({});
    return res.json({ success: true, data: { deletedCount: safeNumber(result?.deletedCount) } });
  } catch (error) {
    console.error('Admin analytics clear error:', error);
    return res.status(500).json({ success: false, message: 'Server error while clearing analytics' });
  }
};

// DELETE /api/admin/analytics?from=&to=
exports.deleteAnalyticsByRange = async (req, res) => {
  try {
    const fromRaw = req.query.from;
    const toRaw = req.query.to;
    if (!fromRaw || !toRaw) {
      return res.status(400).json({ success: false, message: 'from and to are required' });
    }

    const { from, to } = getDateRange(req.query, { defaultDays: 7 });
    const result = await AnalyticsEvent.deleteMany(matchRange({ from, to }));
    return res.json({
      success: true,
      data: { deletedCount: safeNumber(result?.deletedCount), range: { from, to } },
    });
  } catch (error) {
    console.error('Admin analytics delete range error:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting analytics by range' });
  }
};

