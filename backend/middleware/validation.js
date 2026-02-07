const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');

// Constants (from config/constants.js)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5; // Maximum auth attempts per window

// Validation error handler middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// Rate limiting for authentication endpoints
// Disable in test mode to allow multiple rapid requests
const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next() // Bypass rate limiting in tests
  : rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_ATTEMPTS,
      message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
      standardHeaders: true,
      legacyHeaders: false,
    });

module.exports = { validate, authLimiter };
