const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { optionalProtect } = require('../middleware/authMiddleware');
const { ingestEvent } = require('../controllers/analyticsController');

const router = express.Router();

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120, // per IP
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedEvents = new Set([
  'page_view',
  'product_view',
  'add_to_cart',
  'checkout_start',
  'order_success',
  'order_failed',
]);

router.post(
  '/events',
  ingestLimiter,
  optionalProtect,
  [
    body('eventId')
      .isString()
      .isLength({ min: 8, max: 80 })
      .withMessage('eventId must be 8-80 characters'),
    body('eventName')
      .custom((v) => allowedEvents.has(String(v)))
      .withMessage('Invalid eventName'),
    body('anonymousId')
      .isString()
      .isLength({ min: 8, max: 80 })
      .withMessage('anonymousId must be 8-80 characters'),
    body('sessionId')
      .isString()
      .isLength({ min: 8, max: 80 })
      .withMessage('sessionId must be 8-80 characters'),
    body('timestamp').optional().isISO8601().withMessage('timestamp must be ISO8601'),
    body('path').optional().isString().isLength({ max: 500 }),
    body('url').optional().isString().isLength({ max: 1000 }),
    body('title').optional().isString().isLength({ max: 300 }),
    body('attribution').optional().isObject().withMessage('attribution must be an object'),
    body('meta').optional().isObject().withMessage('meta must be an object'),
    body().custom((value) => {
      const hasPath = typeof value?.path === 'string' && value.path.trim().length > 0;
      const hasUrl = typeof value?.url === 'string' && value.url.trim().length > 0;
      if (!hasPath && !hasUrl) {
        throw new Error('path or url is required');
      }
      return true;
    }),
  ],
  ingestEvent
);

module.exports = router;

