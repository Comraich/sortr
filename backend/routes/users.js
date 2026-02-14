const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { authenticateToken, requireAdmin, validate } = require('../middleware');
const db = require('../models');

const router = express.Router();

/**
 * All routes in this file require admin privileges
 */
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/users
 * List all users (without passwords)
 */
router.get('/', async (req, res, next) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID (without password)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post(
  '/',
  [
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('displayName')
      .optional({ checkFalsy: true })
      .trim(),
    body('isAdmin')
      .optional()
      .isBoolean()
      .withMessage('isAdmin must be a boolean'),
    validate
  ],
  async (req, res, next) => {
    try {
      const { username, email, password, displayName, isAdmin } = req.body;

      // Check if username already exists
      const existingUser = await db.User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await db.User.findOne({ where: { email } });
        if (existingEmail) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await db.User.create({
        username,
        email: email || null,
        password: hashedPassword,
        displayName: displayName || null,
        isAdmin: isAdmin || false
      });

      // Return user without password
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.status(201).json(userResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put(
  '/:id',
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage('Must be a valid email address'),
    body('password')
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('displayName')
      .optional({ checkFalsy: true })
      .trim(),
    body('isAdmin')
      .optional()
      .isBoolean()
      .withMessage('isAdmin must be a boolean'),
    validate
  ],
  async (req, res, next) => {
    try {
      const user = await db.User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { username, email, password, displayName, isAdmin } = req.body;

      // Prevent removing admin from the last admin user
      if (isAdmin === false && user.isAdmin) {
        const adminCount = await db.User.count({ where: { isAdmin: true } });
        if (adminCount === 1) {
          return res.status(400).json({
            error: 'Cannot remove admin privileges from the last admin user'
          });
        }
      }

      // Check if new username already exists (if changing username)
      if (username && username !== user.username) {
        const existingUser = await db.User.findOne({ where: { username } });
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }
      }

      // Check if new email already exists (if changing email)
      if (email && email !== user.email) {
        const existingEmail = await db.User.findOne({ where: { email } });
        if (existingEmail) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      // Update fields
      if (username) user.username = username;
      if (email !== undefined) user.email = email || null;
      if (displayName !== undefined) user.displayName = displayName || null;
      if (isAdmin !== undefined) user.isAdmin = isAdmin;

      // Update password if provided
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save();

      // Return user without password
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.json(userResponse);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Prevent deleting the last admin
    if (user.isAdmin) {
      const adminCount = await db.User.count({ where: { isAdmin: true } });
      if (adminCount === 1) {
        return res.status(400).json({
          error: 'Cannot delete the last admin user'
        });
      }
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
