const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { SECRET_KEY, validate, authLimiter } = require('../middleware');
const { User } = require('../models');
const { JWT_EXPIRATION } = require('../config/constants');

// OAuth Helper - Handles OAuth callback by generating JWT and redirecting to frontend
const handleOAuthCallback = (req, res) => {
  const token = jwt.sign(
    { id: req.user.id, username: req.user.username, isAdmin: req.user.isAdmin },
    SECRET_KEY,
    { expiresIn: JWT_EXPIRATION }
  );

  // Redirect to frontend with token in hash fragment (more secure than query param)
  // Hash fragments are not sent to server, so token won't appear in server logs
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/login#token=${token}`);
};

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  handleOAuthCallback
);

// GitHub OAuth Routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  handleOAuthCallback
);

// Microsoft OAuth Routes
router.get('/microsoft', passport.authenticate('microsoft', { prompt: 'select_account' }));
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/login' }),
  handleOAuthCallback
);

// Google Mobile Auth (for Android/iOS apps)
router.post('/google-mobile', async (req, res) => {
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
    const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin }, SECRET_KEY, { expiresIn: JWT_EXPIRATION });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Google mobile auth error:', error);
    res.status(401).json({ error: 'Invalid ID token' });
  }
});

// Register
router.post('/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Must be a valid email address'),
    body('displayName').optional({ checkFalsy: true }).trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { username, password, email, displayName } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Check if this is the first user
      const userCount = await User.count();
      const isFirstUser = userCount === 0;

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        password: hashedPassword,
        email: email || null,
        displayName: displayName || null,
        isAdmin: isFirstUser
      });

      res.status(201).json({
        message: 'User created',
        isAdmin: user.isAdmin
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Login
router.post('/login',
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

      const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin }, SECRET_KEY, { expiresIn: JWT_EXPIRATION });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
