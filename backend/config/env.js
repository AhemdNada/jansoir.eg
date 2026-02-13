const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

const warnOnce = (() => {
  const seen = new Set();
  return (key, message) => {
    if (seen.has(key)) return;
    seen.add(key);
    // eslint-disable-next-line no-console
    console.warn(message);
  };
})();

const requireInProd = (name, value) => {
  if (isProd && (!value || String(value).trim() === '')) {
    throw new Error(`${name} is required in production.`);
  }
  return value;
};

const getJwtSecret = () => {
  const raw = process.env.JWT_SECRET ? String(process.env.JWT_SECRET) : '';
  if (raw.trim()) return raw;

  // Keep local dev working, but never allow this in production.
  requireInProd('JWT_SECRET', raw);
  warnOnce(
    'JWT_SECRET',
    '⚠️  JWT_SECRET is not set. Using an insecure development fallback. Set JWT_SECRET in backend/.env before deploying.'
  );
  return 'dev-insecure-jwt-secret-change-me';
};

const getMongoUri = () => {
  const raw = process.env.MONGODB_URI ? String(process.env.MONGODB_URI) : '';
  if (raw.trim()) return raw;

  // Keep local dev working, but require explicit env in production.
  requireInProd('MONGODB_URI', raw);
  warnOnce(
    'MONGODB_URI',
    '⚠️  MONGODB_URI is not set. Falling back to local MongoDB for development.'
  );
  return 'mongodb://127.0.0.1:27017/shopera';
};

const getPort = () => {
  const n = Number.parseInt(String(process.env.PORT || ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 5000;
};

module.exports = {
  isProd,
  getPort,
  getMongoUri,
  getJwtSecret,
  CORS_ORIGINS: process.env.CORS_ORIGINS ? String(process.env.CORS_ORIGINS) : '',
  PUBLIC_API_URL: process.env.PUBLIC_API_URL ? String(process.env.PUBLIC_API_URL) : '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? String(process.env.GOOGLE_CLIENT_ID) : '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? String(process.env.GOOGLE_CLIENT_SECRET) : '',
};

