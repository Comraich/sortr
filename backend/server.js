const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
require('dotenv').config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 8000;

// Validate required environment variables
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  console.error('FATAL ERROR: SECRET_KEY environment variable is required.');
  console.error('Generate one with: openssl rand -base64 32');
  process.exit(1);
}

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

// --- Database Setup ---
let sequelize;

if (process.env.DB_DIALECT === 'postgres') {
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './inventory.db',
    logging: false
  });
}

// --- Database Models ---

// Location Model
const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

// Box Model
const Box = sequelize.define('Box', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Item Model
const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  boxId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

// --- Model Relationships ---
Location.hasMany(Box, { foreignKey: 'locationId', onDelete: 'RESTRICT' });
Box.belongsTo(Location, { foreignKey: 'locationId' });
Box.hasMany(Item, { foreignKey: 'boxId', onDelete: 'SET NULL' });
Item.belongsTo(Box, { foreignKey: 'boxId' });

// --- User Model ---
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: true },
  googleId: { type: DataTypes.STRING, allowNull: true },
  githubId: { type: DataTypes.STRING, allowNull: true },
  microsoftId: { type: DataTypes.STRING, allowNull: true }
});

// Sync Database (Creates tables if they don't exist)
// In test mode, use force: true to reset database between tests
const syncOptions = process.env.NODE_ENV === 'test'
  ? { force: true }
  : { alter: true };

sequelize.sync(syncOptions).then(() => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Database & tables created!');
  }
});

// --- Passport Config ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_secret',
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      // Find or create user based on Google ID
      const [user, created] = await User.findOrCreate({
        where: { googleId: profile.id },
        defaults: {
          username: profile.emails[0].value,
          googleId: profile.id
        }
      });
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'placeholder_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder_secret',
    callbackURL: "/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      // Find or create user based on GitHub ID
      const [user, created] = await User.findOrCreate({
        where: { githubId: profile.id },
        defaults: {
          username: profile.username, // GitHub guarantees a username
          githubId: profile.id
        }
      });
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID || 'placeholder_id',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'placeholder_secret',
    callbackURL: "/auth/microsoft/callback",
    tenant: process.env.MICROSOFT_TENANT_ID || 'common',
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      // Find or create user based on Microsoft ID
      const [user, created] = await User.findOrCreate({
        where: { microsoftId: profile.id },
        defaults: {
          username: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : profile.userPrincipalName,
          microsoftId: profile.id
        }
      });
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

// --- Rate Limiting ---
// Prevent brute force attacks on authentication endpoints
// Disable in test mode to allow multiple rapid requests
const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next() // Bypass rate limiting in tests
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 requests per windowMs
      message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
      standardHeaders: true,
      legacyHeaders: false,
    });

// --- Validation Middleware ---
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Endpoints ---

// Google Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign({ id: req.user.id, username: req.user.username }, SECRET_KEY, { expiresIn: '7d' });
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${token}`);
  }
);

// GitHub Auth Routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign({ id: req.user.id, username: req.user.username }, SECRET_KEY, { expiresIn: '7d' });
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${token}`);
  }
);

// Microsoft Auth Routes
app.get('/auth/microsoft', passport.authenticate('microsoft', { prompt: 'select_account' }));

app.get('/auth/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign({ id: req.user.id, username: req.user.username }, SECRET_KEY, { expiresIn: '7d' });
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${token}`);
  }
);

// Google Mobile Auth (for Android/iOS apps)
// Verifies Google ID token and returns JWT
app.post('/api/auth/google-mobile', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the ID token with Google
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];

    // Find or create user
    const [user, created] = await User.findOrCreate({
      where: { googleId: googleId },
      defaults: {
        username: email,
        googleId: googleId
      }
    });

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Google mobile auth error:', error);
    res.status(401).json({ error: 'Invalid ID token' });
  }
});

// Register
app.post('/api/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/login',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Check if user has a password (not OAuth-only)
    if (!user.password) {
      return res.status(400).json({ error: 'Please use OAuth to sign in (Google, GitHub, or Microsoft)' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Location Endpoints ---

// List all locations
app.get('/api/locations', authenticateToken, async (req, res) => {
  try {
    const locations = await Location.findAll({ order: [['name', 'ASC']] });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create location
app.post('/api/locations',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Location name is required')
  ],
  validate,
  async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update location
app.put('/api/locations/:id', authenticateToken, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (location) {
      await location.update(req.body);
      res.json(location);
    } else {
      res.status(404).json({ detail: "Location not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete location
app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ detail: "Location not found" });
    }
    const boxCount = await Box.count({ where: { locationId: req.params.id } });
    if (boxCount > 0) {
      return res.status(400).json({ error: `Cannot delete location with ${boxCount} box(es). Remove boxes first.` });
    }
    await location.destroy();
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Box Endpoints ---

// List all boxes (optionally filter by locationId)
app.get('/api/boxes', authenticateToken, async (req, res) => {
  try {
    const where = {};
    if (req.query.locationId) {
      where.locationId = req.query.locationId;
    }
    const boxes = await Box.findAll({
      where,
      include: [{ model: Location, attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });
    res.json(boxes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create box
app.post('/api/boxes',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Box name is required'),
    body('locationId').isInt({ min: 1 }).withMessage('Valid location ID is required')
  ],
  validate,
  async (req, res) => {
  try {
    const box = await Box.create(req.body);
    const boxWithLocation = await Box.findByPk(box.id, {
      include: [{ model: Location, attributes: ['id', 'name'] }]
    });
    res.json(boxWithLocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update box
app.put('/api/boxes/:id', authenticateToken, async (req, res) => {
  try {
    const box = await Box.findByPk(req.params.id);
    if (box) {
      await box.update(req.body);
      const boxWithLocation = await Box.findByPk(box.id, {
        include: [{ model: Location, attributes: ['id', 'name'] }]
      });
      res.json(boxWithLocation);
    } else {
      res.status(404).json({ detail: "Box not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete box
app.delete('/api/boxes/:id', authenticateToken, async (req, res) => {
  try {
    const box = await Box.findByPk(req.params.id);
    if (!box) {
      return res.status(404).json({ detail: "Box not found" });
    }
    const itemCount = await Item.count({ where: { boxId: req.params.id } });
    if (itemCount > 0) {
      return res.status(400).json({ error: `Cannot delete box with ${itemCount} item(s). Remove or reassign items first.` });
    }
    await box.destroy();
    res.json({ message: "Box deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Item Endpoints ---

// Create Item
app.post('/api/items/',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('category').optional().trim(),
    body('boxId').optional().isInt({ min: 1 }).withMessage('Valid box ID is required if provided')
  ],
  validate,
  async (req, res) => {
  try {
    const item = await Item.create(req.body);
    const itemWithBox = await Item.findByPk(item.id, {
      include: [{ model: Box, include: [{ model: Location }] }]
    });
    res.json(itemWithBox);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Read All Items
app.get('/api/items/', authenticateToken, async (req, res) => {
  const offset = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 100;
  try {
    const items = await Item.findAll({
      offset,
      limit,
      include: [{ model: Box, include: [{ model: Location }] }]
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read One Item
app.get('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, {
      include: [{ model: Box, include: [{ model: Location }] }]
    });
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ detail: "Item not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Item
app.put('/api/items/:id',
  authenticateToken,
  [
    body('name').optional().trim().notEmpty().withMessage('Item name cannot be empty'),
    body('category').optional().trim(),
    body('boxId').optional().isInt({ min: 1 }).withMessage('Valid box ID is required if provided')
  ],
  validate,
  async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (item) {
      await item.update(req.body);
      const itemWithBox = await Item.findByPk(item.id, {
        include: [{ model: Box, include: [{ model: Location }] }]
      });
      res.json(itemWithBox);
    } else {
      res.status(404).json({ detail: "Item not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Item
app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (item) {
      await item.destroy();
      res.json({ message: "Item deleted successfully" });
    } else {
      res.status(404).json({ detail: "Item not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
