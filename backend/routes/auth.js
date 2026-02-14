const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { SECRET_KEY, validate, authLimiter } = require('../middleware');
const { User } = require('../models');
const { JWT_EXPIRATION } = require('../config/constants');

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

      const token = jwt.sign({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      }, SECRET_KEY, { expiresIn: JWT_EXPIRATION });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
