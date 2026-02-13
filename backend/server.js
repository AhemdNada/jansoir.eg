const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const helmet = require('helmet');
const compression = require('compression');
const sharp = require('sharp');
require('dotenv').config();

const connectDB = require('./config/db');
const { getPort, PUBLIC_API_URL, CORS_ORIGINS, isProd } = require('./config/env');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const historyRoutes = require('./routes/historyRoutes');
const cartRoutes = require('./routes/cartRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const customizeRoutes = require('./routes/customizeRoutes');
const adminCustomizeRoutes = require('./routes/adminCustomizeRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const couponRoutes = require('./routes/couponRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { ensureShippingGovernorates } = require('./utils/ensureShippingGovernorates');
const AnalyticsEvent = require('./models/AnalyticsEvent');

const app = express();

// Middleware
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(compression());

const parseOrigins = () => {
    const raw = CORS_ORIGINS;
    if (!raw) {
        if (isProd) {
            console.warn('⚠️ CORS_ORIGINS is not set in production.');
        }
        return [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:4173',
            'http://127.0.0.1:4173',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
    }
    return raw.split(',').map(s => s.trim()).filter(Boolean);
};

const allowedOrigins = parseOrigins();
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, origin);
        if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, origin);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Image optimization for /uploads
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const UPLOADS_CACHE_DIR = path.join(UPLOADS_DIR, '.cache');
const UPLOADS_DIR_RESOLVED = path.resolve(UPLOADS_DIR);
const SUPPORTED_OUTPUT_FORMATS = new Set(['webp', 'avif', 'jpeg', 'png']);
const SUPPORTED_INPUT_EXT = /\.(png|jpe?g|webp|avif)$/i;

const clampInt = (value, min, max, fallback) => {
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
};

app.get('/uploads/:folder/:filename', async (req, res, next) => {
    const { folder, filename } = req.params;
    const { w, format, q } = req.query || {};
    if (w == null && format == null && q == null) return next();
    if (!SUPPORTED_INPUT_EXT.test(filename)) return next();

    const width = clampInt(w, 1, 2400, null);
    const outFormat = String(format || 'webp').toLowerCase();
    const quality = clampInt(q, 40, 90, 75);

    if (!SUPPORTED_OUTPUT_FORMATS.has(outFormat)) {
        return res.status(400).json({ message: 'Unsupported image format' });
    }

    const inputPath = path.resolve(UPLOADS_DIR, folder, filename);
    if (!inputPath.startsWith(UPLOADS_DIR_RESOLVED + path.sep)) {
        return res.status(400).json({ message: 'Invalid path' });
    }

    try {
        const stat = await fsp.stat(inputPath);
        if (!stat.isFile()) return next();
    } catch {
        return next();
    }

    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const cacheDir = path.join(UPLOADS_CACHE_DIR, folder);
    const cacheFile = `${base}.${width ? `${width}w` : 'orig'}.q${quality}.${outFormat}`;
    const cachePath = path.join(cacheDir, cacheFile);

    try {
        if (fs.existsSync(cachePath)) {
            res.setHeader('Content-Type', `image/${outFormat === 'jpeg' ? 'jpeg' : outFormat}`);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            return fs.createReadStream(cachePath).pipe(res);
        }

        await fsp.mkdir(cacheDir, { recursive: true });

        let img = sharp(inputPath, { failOnError: false }).rotate();
        if (width) img = img.resize({ width, withoutEnlargement: true });

        const buffer = await img.toFormat(outFormat, { quality, ...(outFormat === 'jpeg' ? { mozjpeg: true } : null) }).toBuffer();
        fsp.writeFile(cachePath, buffer).catch(() => undefined);

        res.setHeader('Content-Type', `image/${outFormat === 'jpeg' ? 'jpeg' : outFormat}`);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        return res.end(buffer);
    } catch (err) {
        console.warn('Image optimize failed:', err?.message || err);
        return next();
    }
});

app.use('/uploads', express.static(UPLOADS_DIR, {
    maxAge: '7d',
    immutable: false,
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/customize', customizeRoutes);
app.use('/api/admin/customize', adminCustomizeRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Shopera API is running' }));

app.use(notFound);
app.use(errorHandler);

const PORT = getPort();

// ✅ Connect to MongoDB Atlas
connectDB()
    .then(async () => {
        await ensureShippingGovernorates();
        try { await AnalyticsEvent.syncIndexes(); } catch (e) { console.warn('Analytics indexes not fully synced:', e?.message || e); }
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            const base = PUBLIC_API_URL ? String(PUBLIC_API_URL).replace(/\/+$/, '') : '';
            console.log(`📦 API available at ${base ? `${base}/api` : '/api'}`);
            console.log(`🗄️  Data stored in MongoDB Atlas`);
        });
    })
    .catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
