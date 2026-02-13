const { validationResult } = require('express-validator');
const crypto = require('crypto');
// IMPORTANT: Per latest requirement, we do NOT store AnalyticsEvents in MongoDB.
// We keep ingestion for compatibility (validation + rate limit), but we drop events.
// const AnalyticsEvent = require('../models/AnalyticsEvent');

const MAX_META_BYTES = 10 * 1024; // 10KB
const DEDUPE_BUCKET_MS = Math.min(Math.max(Number(process.env.ANALYTICS_DEDUPE_BUCKET_MS || 2000), 250), 10_000);
const MAX_ITEMS = 50;

function safeJsonByteLength(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value || {}), 'utf8');
  } catch {
    return Infinity;
  }
}

const FORBIDDEN_META_KEYS = new Set([
  'userId',
  'adminId',
  'token',
  'authorization',
  'auth',
  'password',
  'jwt',
]);

function clampString(value, maxLen) {
  const s = String(value ?? '');
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen);
}

function clampNumber(value, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
}

function sanitizeMeta(eventName, meta) {
  const input = meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};

  // Drop obviously sensitive/abusive keys
  const cleaned = {};
  for (const [k, v] of Object.entries(input)) {
    if (FORBIDDEN_META_KEYS.has(k)) continue;
    cleaned[k] = v;
  }

  const name = String(eventName || '');
  if (name === 'page_view') return {};

  if (name === 'product_view') {
    const out = {};
    if (cleaned.productId) out.productId = clampString(cleaned.productId, 40);
    if (cleaned.category) out.category = clampString(cleaned.category, 80);
    const price = clampNumber(cleaned.price, { min: 0, max: 10_000_000 });
    if (price !== null) out.price = price;
    return out;
  }

  if (name === 'add_to_cart') {
    const out = {};
    if (cleaned.productId) out.productId = clampString(cleaned.productId, 40);
    const quantity = clampNumber(cleaned.quantity, { min: 1, max: 999 });
    if (quantity !== null) out.quantity = quantity;
    const price = clampNumber(cleaned.price, { min: 0, max: 10_000_000 });
    if (price !== null) out.price = price;
    const value = clampNumber(cleaned.value, { min: 0, max: 100_000_000 });
    if (value !== null) out.value = value;
    if (cleaned.size) out.size = clampString(cleaned.size, 40);
    if (cleaned.color) out.color = clampString(cleaned.color, 40);
    if (cleaned.category) out.category = clampString(cleaned.category, 80);
    return out;
  }

  if (name === 'checkout_start') {
    const out = {};
    const itemsCount = clampNumber(cleaned.itemsCount, { min: 0, max: 999 });
    if (itemsCount !== null) out.itemsCount = itemsCount;
    const subtotal = clampNumber(cleaned.subtotal, { min: 0, max: 100_000_000 });
    if (subtotal !== null) out.subtotal = subtotal;

    if (Array.isArray(cleaned.items)) {
      out.items = cleaned.items.slice(0, MAX_ITEMS).map((it) => {
        const obj = it && typeof it === 'object' && !Array.isArray(it) ? it : {};
        return {
          productId: obj.productId ? clampString(obj.productId, 40) : '',
          quantity: clampNumber(obj.quantity, { min: 1, max: 999 }) ?? 1,
          price: clampNumber(obj.price, { min: 0, max: 10_000_000 }) ?? 0,
          size: obj.size ? clampString(obj.size, 40) : '',
          color: obj.color ? clampString(obj.color, 40) : '',
        };
      });
    }
    return out;
  }

  if (name === 'order_success') {
    const out = {};
    if (cleaned.orderId) out.orderId = clampString(cleaned.orderId, 60);
    const value = clampNumber(cleaned.value, { min: 0, max: 100_000_000 });
    if (value !== null) out.value = value;
    if (cleaned.paymentMethod) out.paymentMethod = clampString(cleaned.paymentMethod, 40);
    const itemsCount = clampNumber(cleaned.itemsCount, { min: 0, max: 999 });
    if (itemsCount !== null) out.itemsCount = itemsCount;
    return out;
  }

  if (name === 'order_failed') {
    const out = {};
    if (cleaned.message) out.message = clampString(cleaned.message, 200);
    if (cleaned.reason) out.reason = clampString(cleaned.reason, 200);
    if (cleaned.error) out.error = clampString(cleaned.error, 200);
    return out;
  }

  // Default: keep nothing (future events must be explicitly added)
  return {};
}

function pickAttribution(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    utm_source: String(input.utm_source || '').trim(),
    utm_medium: String(input.utm_medium || '').trim(),
    utm_campaign: String(input.utm_campaign || '').trim(),
    utm_content: String(input.utm_content || '').trim(),
    utm_term: String(input.utm_term || '').trim(),
    referrer: String(input.referrer || '').trim(),
  };
}

function normalizePathForStorage(input) {
  const raw = String(input || '').trim();
  if (!raw) return '/';

  let pathname = raw;
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      pathname = new URL(raw).pathname || '/';
    } else {
      pathname = raw.split('?')[0].split('#')[0] || '/';
    }
  } catch {
    pathname = raw.split('?')[0].split('#')[0] || '/';
  }

  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, '/');
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return pathname;
}

function toPathTemplate(pathname) {
  const p = String(pathname || '').trim();
  if (!p) return '';
  if (/^\/product\/[a-f0-9]{24}$/i.test(p)) return '/product/:id';
  return '';
}

function normalizePathKey(input) {
  const raw = String(input || '').trim();
  if (!raw) return '/';

  let pathname = raw;
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      pathname = new URL(raw).pathname || '/';
    } else {
      pathname = raw.split('?')[0].split('#')[0] || '/';
    }
  } catch {
    pathname = raw.split('?')[0].split('#')[0] || '/';
  }

  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, '/');
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return pathname;
}

function buildSignatureBase({ eventName, anonymousId, sessionId, path, metaKey }) {
  return `${String(eventName)}|${String(anonymousId)}|${String(sessionId)}|${String(path)}|${String(metaKey || '')}`;
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// @desc Ingest analytics event (guest + logged-in)
// @route POST /api/analytics/events
// @access Public (optional auth)
exports.ingestEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid analytics payload',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      });
    }

    const {
      eventId,
      eventName,
      anonymousId,
      sessionId,
      attribution,
      path,
      url,
      title,
      timestamp,
      meta,
    } = req.body || {};

    const metaValueRaw = meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};
    const metaValue = sanitizeMeta(eventName, metaValueRaw);
    if (safeJsonByteLength(metaValue) > MAX_META_BYTES) {
      return res.status(400).json({
        success: false,
        message: `meta payload is too large (max ${MAX_META_BYTES} bytes)`,
      });
    }

    let clientTimestamp = null;
    if (timestamp) {
      const dt = new Date(timestamp);
      if (!Number.isNaN(dt.getTime())) {
        clientTimestamp = dt;
      }
    }

    // Normalize and compute signature for debugging, but DO NOT store.
    const normalizedPath = normalizePathForStorage(path || url || '/');
    const pathTemplate = toPathTemplate(normalizedPath);
    const signaturePathKey = normalizePathKey(url || path || '/');
    const metaKey = (metaValue && (metaValue.productId || metaValue.orderId)) ? String(metaValue.productId || metaValue.orderId) : '';
    const signatureBase = buildSignatureBase({ eventName, anonymousId, sessionId, path: signaturePathKey, metaKey });
    const signature = sha256Hex(signatureBase);
    const timeBucket = Math.floor(Date.now() / DEDUPE_BUCKET_MS);

    return res.status(202).json({
      success: true,
      data: {
        stored: false,
        normalizedPath,
        pathTemplate,
        signature,
        timeBucket,
      }
    });
  } catch (error) {
    console.error('Analytics ingest error:', error);
    return res.status(500).json({ success: false, message: 'Server error while ingesting analytics event' });
  }
};

