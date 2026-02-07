const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
require('dotenv').config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 8000;

// Import models and database
const { sequelize, User } = require('./models');

// Import and configure Passport
const configurePassport = require('./config/passport');
configurePassport(User);

// --- Middleware ---
// Request logging (skip in test mode to reduce noise)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Passport initialization
app.use(passport.initialize());

// --- Database Sync ---
// Sync Database (Creates tables if they don't exist)
// In test mode, use force: true to reset database between tests
// In production, use migrations (npx sequelize-cli db:migrate) instead of sync
const syncOptions = process.env.NODE_ENV === 'test'
  ? { force: true }
  : {}; // Removed { alter: true } - use migrations for schema changes

// Store the sync promise so tests can await it
const dbReady = sequelize.sync(syncOptions).then(() => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Database synced! Use "npx sequelize-cli db:migrate" for schema changes.');
  }
});

// --- Routes ---
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/locations');
const boxRoutes = require('./routes/boxes');
const itemRoutes = require('./routes/items');

// Mount routes
app.use('/health', healthRoutes);
// Auth routes are mounted at both /auth and /api to support:
// - OAuth routes: /auth/google, /auth/github, /auth/microsoft
// - API routes: /api/register, /api/login, /api/auth/google-mobile
app.use('/auth', authRoutes);
app.use('/api', authRoutes); // This makes /api/register, /api/login available
app.use('/api/locations', locationRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/items', itemRoutes);

// --- Error Handling Middleware ---
// 404 handler - must be after all routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => e.message)
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Duplicate entry',
      details: err.errors.map(e => e.message)
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference - the related record does not exist'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start Server (only if run directly, not imported for tests)
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Node.js server running at http://0.0.0.0:${port}`);
  });
}

// Export for testing
module.exports = app;
module.exports.dbReady = dbReady;
