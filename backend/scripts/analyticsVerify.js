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
  const minutes = Math.min(Math.max(Number(args.minutes || 30), 1), 24 * 60);
  const since = new Date(Date.now() - minutes * 60 * 1000);

  await connectDB();

  const total = await AnalyticsEvent.countDocuments({ createdAt: { $gte: since } });
  // Detect duplicates that should be impossible once indexes are in place.
  const dupes = await AnalyticsEvent.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        signature: { $ne: '' },
        timeBucket: { $gt: 0 },
        eventName: { $in: ['page_view', 'product_view', 'checkout_start', 'order_success', 'order_failed'] },
      },
    },
    { $group: { _id: { signature: '$signature', timeBucket: '$timeBucket' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  // Quick sanity: count page_view vs distinct session visits
  const pageViews = await AnalyticsEvent.countDocuments({ createdAt: { $gte: since }, eventName: 'page_view', path: { $not: /^\/admin/ } });
  const distinctVisits = await AnalyticsEvent.aggregate([
    { $match: { createdAt: { $gte: since }, eventName: 'page_view', path: { $not: /^\/admin/ }, sessionId: { $ne: '' } } },
    { $group: { _id: '$sessionId' } },
    { $count: 'count' },
  ]);

  // Missing required fields for new events (best-effort check)
  const missingFields = await AnalyticsEvent.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $project: {
        eventIdMissing: { $or: [{ $not: ['$eventId'] }, { $eq: ['$eventId', ''] }] },
        sessionMissing: { $or: [{ $not: ['$sessionId'] }, { $eq: ['$sessionId', ''] }] },
        anonMissing: { $or: [{ $not: ['$anonymousId'] }, { $eq: ['$anonymousId', ''] }] },
        pathMissing: { $or: [{ $not: ['$path'] }, { $eq: ['$path', ''] }] },
        pathHasUtm: { $regexMatch: { input: { $toLower: '$path' }, regex: /utm_/ } },
        pathHasQuery: { $regexMatch: { input: '$path', regex: /\?/ } },
      },
    },
    {
      $group: {
        _id: null,
        eventIdMissing: { $sum: { $cond: ['$eventIdMissing', 1, 0] } },
        sessionMissing: { $sum: { $cond: ['$sessionMissing', 1, 0] } },
        anonMissing: { $sum: { $cond: ['$anonMissing', 1, 0] } },
        pathMissing: { $sum: { $cond: ['$pathMissing', 1, 0] } },
        pathHasUtm: { $sum: { $cond: ['$pathHasUtm', 1, 0] } },
        pathHasQuery: { $sum: { $cond: ['$pathHasQuery', 1, 0] } },
      },
    },
  ]);

  const missing = missingFields?.[0] || {};

  console.log('--- Analytics Verify ---');
  console.log(`Window: last ${minutes} minutes (since ${since.toISOString()})`);
  console.log(`Events total: ${total}`);
  console.log(`page_view raw events: ${pageViews}`);
  console.log(`Visits (distinct sessions): ${Number(distinctVisits?.[0]?.count || 0)}`);
  console.log('');
  console.log('Data hygiene checks (should be 0):');
  console.log(`- missing eventId: ${Number(missing.eventIdMissing || 0)}`);
  console.log(`- missing sessionId: ${Number(missing.sessionMissing || 0)}`);
  console.log(`- missing anonymousId: ${Number(missing.anonMissing || 0)}`);
  console.log(`- missing path: ${Number(missing.pathMissing || 0)}`);
  console.log(`- path contains "utm_": ${Number(missing.pathHasUtm || 0)}`);
  console.log(`- path contains "?": ${Number(missing.pathHasQuery || 0)}`);
  console.log('');
  if (dupes.length === 0) {
    console.log('No duplicate signature+bucket groups found (good).');
  } else {
    console.log('Duplicates found (should be 0):');
    dupes.forEach(d => console.log(`- ${d.count}x`, d._id));
    console.log('');
    console.log('Fix suggestion: run `npm run analytics:dedupe` then restart backend to allow unique indexes to build cleanly.');
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

