const express = require('express');
const cors = require('cors');
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
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret';

// --- Middleware ---
app.use(cors()); // Allow Frontend to communicate with Backend
app.use(express.json()); // Parse JSON bodies
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
sequelize.sync({ alter: true }).then(() => {
  console.log('Database & tables created!');
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
    const token = jwt.sign({ id: req.user.id, username: req.user.username }, SECRET_KEY);
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
    const token = jwt.sign({ id: req.user.id, username: req.user.username }, SECRET_KEY);
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
    const token = jwt.sign({ id: req.user.id, username: req.user.username }, SECRET_KEY);
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${token}`);
  }
);

// Register
app.post('/api/register', async (req, res) => {
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
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
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
app.post('/api/locations', authenticateToken, async (req, res) => {
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
app.post('/api/boxes', authenticateToken, async (req, res) => {
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
app.post('/api/items/', authenticateToken, async (req, res) => {
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
app.put('/api/items/:id', authenticateToken, async (req, res) => {
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

// Start Server
app.listen(port, '0.0.0.0', () => {
  console.log(`Node.js server running at http://0.0.0.0:${port}`);
});
