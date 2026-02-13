const mongoose = require('mongoose');

const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

const attributionSchema = new mongoose.Schema({
  utm_source: { type: String, default: '', trim: true, maxlength: 120 },
  utm_medium: { type: String, default: '', trim: true, maxlength: 120 },
  utm_campaign: { type: String, default: '', trim: true, maxlength: 200 },
  utm_content: { type: String, default: '', trim: true, maxlength: 200 },
  utm_term: { type: String, default: '', trim: true, maxlength: 200 },
  referrer: { type: String, default: '', trim: true, maxlength: 500 },
}, { _id: false });

const analyticsEventSchema = new mongoose.Schema({
  // Idempotency key generated on client (uuid-ish). Prevents accidental replays/resends.
  // NOTE: kept optional at schema level to avoid breaking existing DBs with old docs.
  // Ingestion API validation enforces presence for new events.
  eventId: { type: String, default: '', trim: true, minlength: 0, maxlength: 80 },

  eventName: {
    type: String,
    required: true,
    enum: [
      'page_view',
      'product_view',
      'add_to_cart',
      'checkout_start',
      'order_success',
      'order_failed',
    ],
    index: true,
  },

  // Identity
  anonymousId: { type: String, required: true, trim: true, minlength: 8, maxlength: 80, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  // NOTE: kept optional at schema level for existing docs; ingestion enforces for new events.
  sessionId: { type: String, default: '', trim: true, minlength: 0, maxlength: 80, index: true },

  // Attribution snapshot (client-provided + sanitized)
  attribution: { type: attributionSchema, default: () => ({}) },

  // Page snapshot
  path: { type: String, default: '', trim: true, maxlength: 500, index: true },
  // Optional templated path for grouping (e.g. /product/:id). Stored alongside real path.
  pathTemplate: { type: String, default: '', trim: true, maxlength: 200, index: true },
  url: { type: String, default: '', trim: true, maxlength: 1000 },
  title: { type: String, default: '', trim: true, maxlength: 300 },

  // Client timestamp (optional) + server timestamp (createdAt)
  clientTimestamp: { type: Date, default: null },

  // Flexible event payload (validated for size in controller)
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Optional for faster querying/dedupe and top-product style breakdowns
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null, index: true },

  // Secondary dedupe safety (mainly for page/product views under dev StrictMode):
  // signature is a SHA-256 of stable fields, timeBucket is a small time slice.
  signature: { type: String, default: '', trim: true, maxlength: 80, index: true },
  timeBucket: { type: Number, default: 0, index: true },

  // Minimal request context
  userAgent: { type: String, default: '', trim: true, maxlength: 400 },
}, { timestamps: true });

analyticsEventSchema.index({ createdAt: 1, eventName: 1 });
analyticsEventSchema.index({ createdAt: 1, anonymousId: 1 });
analyticsEventSchema.index({ createdAt: 1, userId: 1 });

// Enforce eventId uniqueness only when present (safe for existing DBs).
analyticsEventSchema.index(
  { eventId: 1 },
  {
    unique: true,
    // Keep expression compatible with older MongoDB versions.
    // Avoid $ne (some older versions reject it in partial indexes).
    partialFilterExpression: { eventId: { $exists: true, $gt: '' } },
  }
);

// Only enforce signature+bucket uniqueness for events that should not double-fire.
analyticsEventSchema.index(
  { signature: 1, timeBucket: 1 },
  {
    unique: true,
    partialFilterExpression: {
      eventName: { $in: ['page_view', 'product_view', 'checkout_start', 'order_success', 'order_failed'] },
      // Avoid $ne (some older versions reject it in partial indexes).
      signature: { $gt: '' },
      timeBucket: { $gt: 0 },
    },
  }
);

// Optional TTL index to prevent unbounded growth.
// Enable by setting ANALYTICS_TTL_DAYS to a positive integer (e.g. 90).
// Note: Changing TTL days requires dropping/recreating the index manually.
const ttlDays = Number(process.env.ANALYTICS_TTL_DAYS || 0);
if (Number.isFinite(ttlDays) && ttlDays > 0) {
  analyticsEventSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: Math.floor(ttlDays * 24 * 60 * 60) }
  );
}

analyticsEventSchema.pre('validate', function normalizeAttribution() {
  if (!this.attribution) this.attribution = {};

  for (const f of UTM_FIELDS) {
    if (this.attribution[f] === undefined || this.attribution[f] === null) {
      this.attribution[f] = '';
    }

    this.attribution[f] = String(this.attribution[f] || '').trim();
  }

  this.attribution.referrer = String(this.attribution.referrer || '').trim();
});

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);

