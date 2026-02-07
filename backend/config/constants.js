// Application constants

// JWT Configuration
const JWT_EXPIRATION = '7d'; // JWT token expiration time

// Rate Limiting Configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const RATE_LIMIT_MAX_ATTEMPTS = 5; // Maximum auth attempts per window

// Query Configuration
const DEFAULT_QUERY_LIMIT = 100; // Default limit for paginated queries

module.exports = {
  JWT_EXPIRATION,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_ATTEMPTS,
  DEFAULT_QUERY_LIMIT
};
