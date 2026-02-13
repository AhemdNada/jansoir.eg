require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const AnalyticsEvent = require('../models/AnalyticsEvent');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
    out[key] = val;
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const minutes = Math.min(Math.max(Number(args.minutes || 1440), 1), 365 * 24 * 60);
  const since = new Date(Date.now() - minutes * 60 * 1000);

  await connectDB();

  const targetEvents = ['page_view', 'product_view', 'checkout_start', 'order_success', 'order_failed'];

  // Find duplicate groups and keep the earliest doc per group.
  const groups = await AnalyticsEvent.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        signature: { $ne: '' },
        timeBucket: { $gt: 0 },
        eventName: { $in: targetEvents },
      },
    },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: { signature: '$signature', timeBucket: '$timeBucket' },
        ids: { $push: '$_id' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  let toDelete = [];
  groups.forEach((g) => {
    const ids = g.ids || [];
    // Keep first (earliest), delete rest
    toDelete = toDelete.concat(ids.slice(1));
  });

  console.log('--- Analytics Dedupe ---');
  console.log(`Window: last ${minutes} minutes (since ${since.toISOString()})`);
  console.log(`Duplicate groups: ${groups.length}`);
  console.log(`Documents to delete: ${toDelete.length}`);

  if (toDelete.length === 0) {
    await mongoose.disconnect();
    return;
  }

  if (String(args.dryRun || '').toLowerCase() === 'true') {
    console.log('dryRun=true, not deleting.');
    await mongoose.disconnect();
    return;
  }

  const res = await AnalyticsEvent.deleteMany({ _id: { $in: toDelete } });
  console.log(`Deleted: ${res.deletedCount || 0}`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

