import { API_BASE_URL } from '../api/apiConfig';

const LS_ANON_ID = 'analytics_anonymous_id_v1';
const SS_SESSION_ID = 'analytics_session_id_v1';
const LS_UTM = 'analytics_utm_v1';
const LS_FIRST_REFERRER = 'analytics_first_referrer_v1';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

const DEBUG = String(import.meta?.env?.VITE_ANALYTICS_DEBUG || '').toLowerCase() === 'true';
const DEDUPE_WINDOW_MS = Math.min(
  Math.max(Number(import.meta?.env?.VITE_ANALYTICS_DEDUPE_WINDOW_MS || 1500), 250),
  10_000
);

// Module-level (singleton) dedupe store to survive rerenders and StrictMode remounts.
// Key: event signature, Value: lastSentAt (ms).
const recentEventSignatures = new Map();
const MAX_SIGNATURES = 800;

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore
  }
}

function uuid() {
  try {
    // modern browsers
    return crypto.randomUUID();
  } catch {
    // fallback
    return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getOrCreateAnonymousId() {
  const existing = safeGet(localStorage, LS_ANON_ID);
  if (existing && typeof existing === 'string' && existing.length >= 8) return existing;
  const id = uuid();
  safeSet(localStorage, LS_ANON_ID, id);
  return id;
}

export function getOrCreateSessionId() {
  const existing = safeGet(sessionStorage, SS_SESSION_ID);
  if (existing && typeof existing === 'string' && existing.length >= 8) return existing;
  const id = uuid();
  safeSet(sessionStorage, SS_SESSION_ID, id);
  return id;
}

function readStoredUtm() {
  try {
    const raw = safeGet(localStorage, LS_UTM);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistUtmIfPresent(search) {
  try {
    const params = new URLSearchParams(String(search || ''));
    const found = {};
    let hasAny = false;
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) {
        found[k] = String(v).trim().slice(0, 200);
        hasAny = true;
      }
    }
    if (!hasAny) return;
    const current = readStoredUtm();
    const next = { ...current, ...found };
    safeSet(localStorage, LS_UTM, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function persistFirstReferrerIfMissing() {
  const existing = safeGet(localStorage, LS_FIRST_REFERRER);
  if (existing) return;
  const ref = typeof document !== 'undefined' ? String(document.referrer || '').trim() : '';
  if (!ref) return;
  safeSet(localStorage, LS_FIRST_REFERRER, ref.slice(0, 500));
}

function getAttributionSnapshot() {
  const utm = readStoredUtm();
  const referrer = safeGet(localStorage, LS_FIRST_REFERRER) || '';
  return {
    utm_source: String(utm.utm_source || ''),
    utm_medium: String(utm.utm_medium || ''),
    utm_campaign: String(utm.utm_campaign || ''),
    utm_content: String(utm.utm_content || ''),
    utm_term: String(utm.utm_term || ''),
    referrer: String(referrer || ''),
  };
}

function getAuthTokenFromStorage() {
  const token = safeGet(localStorage, 'token');
  return token && typeof token === 'string' ? token : '';
}

function debugLog(...args) {
  if (!DEBUG) return;
  console.info('[analytics]', ...args);
}

export function normalizePath(input) {
  const raw = String(input || '').trim();
  if (!raw) return '/';

  let pathname = raw;
  try {
    // Support full URLs
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      pathname = new URL(raw).pathname || '/';
    } else {
      // Strip query/hash if present
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

export function toPathTemplate(pathname) {
  const p = String(pathname || '').trim();
  if (!p) return '';
  if (/^\/product\/[a-f0-9]{24}$/i.test(p)) return '/product/:id';
  return '';
}

// Back-compat: signature "pathKey" is the real clean path (no query/hash).
export const normalizePathKey = normalizePath;

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
  const name = String(eventName || '');

  if (name === 'page_view') return {};

  if (name === 'product_view') {
    const out = {};
    if (input.productId) out.productId = clampString(input.productId, 40);
    if (input.category) out.category = clampString(input.category, 80);
    const price = clampNumber(input.price, { min: 0, max: 10_000_000 });
    if (price !== null) out.price = price;
    return out;
  }

  if (name === 'add_to_cart') {
    const out = {};
    if (input.productId) out.productId = clampString(input.productId, 40);
    const quantity = clampNumber(input.quantity, { min: 1, max: 999 });
    if (quantity !== null) out.quantity = quantity;
    const price = clampNumber(input.price, { min: 0, max: 10_000_000 });
    if (price !== null) out.price = price;
    const value = clampNumber(input.value, { min: 0, max: 100_000_000 });
    if (value !== null) out.value = value;
    if (input.size) out.size = clampString(input.size, 40);
    if (input.color) out.color = clampString(input.color, 40);
    if (input.category) out.category = clampString(input.category, 80);
    return out;
  }

  if (name === 'checkout_start') {
    const out = {};
    const itemsCount = clampNumber(input.itemsCount, { min: 0, max: 999 });
    if (itemsCount !== null) out.itemsCount = itemsCount;
    const subtotal = clampNumber(input.subtotal, { min: 0, max: 100_000_000 });
    if (subtotal !== null) out.subtotal = subtotal;
    if (Array.isArray(input.items)) {
      out.items = input.items.slice(0, 50).map((it) => ({
        productId: it?.productId ? clampString(it.productId, 40) : '',
        quantity: clampNumber(it?.quantity, { min: 1, max: 999 }) ?? 1,
        price: clampNumber(it?.price, { min: 0, max: 10_000_000 }) ?? 0,
        size: it?.size ? clampString(it.size, 40) : '',
        color: it?.color ? clampString(it.color, 40) : '',
      }));
    }
    return out;
  }

  if (name === 'order_success') {
    const out = {};
    if (input.orderId) out.orderId = clampString(input.orderId, 60);
    const value = clampNumber(input.value, { min: 0, max: 100_000_000 });
    if (value !== null) out.value = value;
    if (input.paymentMethod) out.paymentMethod = clampString(input.paymentMethod, 40);
    const itemsCount = clampNumber(input.itemsCount, { min: 0, max: 999 });
    if (itemsCount !== null) out.itemsCount = itemsCount;
    return out;
  }

  if (name === 'order_failed') {
    const out = {};
    if (input.message) out.message = clampString(input.message, 200);
    if (input.reason) out.reason = clampString(input.reason, 200);
    if (input.error) out.error = clampString(input.error, 200);
    return out;
  }

  return {};
}

function getMetaKey(meta) {
  const m = meta && typeof meta === 'object' ? meta : {};
  const productId = m.productId ? String(m.productId) : '';
  const orderId = m.orderId ? String(m.orderId) : '';
  return productId || orderId || '';
}

export function buildEventSignature({ eventName, sessionId, path, meta }) {
  return `${String(eventName)}|${String(sessionId || '')}|${String(path || '')}|${getMetaKey(meta)}`;
}

function getDedupeWindowForEvent(eventName) {
  const name = String(eventName || '');
  // Only dedupe events that are known to double-fire from StrictMode/effects
  // or should never be duplicated in a short window.
  if (name === 'page_view') return DEDUPE_WINDOW_MS;
  if (name === 'product_view') return DEDUPE_WINDOW_MS;
  if (name === 'checkout_start') return DEDUPE_WINDOW_MS;
  if (name === 'order_success') return Math.max(DEDUPE_WINDOW_MS, 5000);
  if (name === 'order_failed') return Math.max(DEDUPE_WINDOW_MS, 5000);
  // add_to_cart is a user action and may occur multiple times quickly.
  return 0;
}

function shouldSkipDuplicate(signature, windowMs) {
  if (!windowMs || windowMs <= 0) return false;
  const now = Date.now();
  const last = recentEventSignatures.get(signature);
  if (last && now - last < windowMs) {
    return true;
  }
  recentEventSignatures.set(signature, now);

  // Simple bounded memory: prune oldest when too big.
  if (recentEventSignatures.size > MAX_SIGNATURES) {
    const entries = Array.from(recentEventSignatures.entries()).sort((a, b) => a[1] - b[1]);
    const toDelete = entries.slice(0, Math.floor(MAX_SIGNATURES * 0.25));
    toDelete.forEach(([k]) => recentEventSignatures.delete(k));
  }
  return false;
}

async function sendEventPayload(payload, { preferBeacon = false } = {}) {
  const token = getAuthTokenFromStorage();
  const url = `${API_BASE_URL}/analytics/events`;

  if (!token && preferBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      // sendBeacon cannot set Authorization header; we only use it for guest-safe events (page_view).
      navigator.sendBeacon(url, blob);
      return;
    } catch {
      // fallback to fetch
    }
  }

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // analytics must never break UX
  });
}

export function initAnalyticsAttribution() {
  persistFirstReferrerIfMissing();
  persistUtmIfPresent(window.location.search);
  getOrCreateAnonymousId();
  getOrCreateSessionId();
}

export async function trackEvent(eventName, meta = {}, opts = {}) {
  // Initialize lazily in case this is called early
  initAnalyticsAttribution();

  const normalizedPath = normalizePath(window.location.pathname);
  const signaturePathKey = normalizePathKey(window.location.pathname);
  const pathTemplate = toPathTemplate(normalizedPath);
  const sessionId = getOrCreateSessionId();
  const safeMeta = sanitizeMeta(eventName, meta);
  const signature = buildEventSignature({
    eventName,
    sessionId,
    path: signaturePathKey,
    meta: safeMeta,
  });

  const windowMs = getDedupeWindowForEvent(eventName);
  if (shouldSkipDuplicate(signature, windowMs)) {
    debugLog('skip(dupe)', signature, { windowMs });
    return;
  }

  const payload = {
    eventId: uuid(),
    eventName,
    anonymousId: getOrCreateAnonymousId(),
    sessionId,
    attribution: getAttributionSnapshot(),
    // IMPORTANT: Store a clean, stable path (no query string). UTM lives in attribution.* only.
    path: normalizedPath,
    pathTemplate,
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    meta: safeMeta,
  };

  await sendEventPayload(payload, opts);
  debugLog('sent', signature);
}

export async function trackPageView(location) {
  // Update UTM attribution when landing with utm params
  persistUtmIfPresent(location?.search || window.location.search);
  persistFirstReferrerIfMissing();

  const pathname = location?.pathname || window.location.pathname;
  const normalized = normalizePath(pathname);
  if (String(normalized).startsWith('/admin')) return;

  await trackEvent('page_view', {}, { preferBeacon: true });
}

