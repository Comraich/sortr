const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const db = require('../models');

const router = express.Router();

/**
 * All routes in this file require authentication
 */
router.use(authenticateToken);

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get('/', async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
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
 * PUT /api/profile
 * Update current user's profile
 */
router.put(
  '/',
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
    body('displayName')
      .optional({ checkFalsy: true })
      .trim(),
    body('currentPassword')
      .optional({ checkFalsy: true }),
    body('newPassword')
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    validate
  ],
  async (req, res, next) => {
    try {
      const user = await db.User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { username, email, displayName, currentPassword, newPassword } = req.body;

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

      // Handle password change
      if (newPassword) {
        // Verify current password for non-OAuth users
        if (!user.password) {
          return res.status(400).json({
            error: 'Cannot change password for OAuth accounts'
          });
        }

        if (!currentPassword) {
          return res.status(400).json({
            error: 'Current password is required to set a new password'
          });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash and update new password
        user.password = await bcrypt.hash(newPassword, 10);
      }

      // Update other fields
      if (username) user.username = username;
      if (email !== undefined) user.email = email || null;
      if (displayName !== undefined) user.displayName = displayName || null;

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

module.exports = router;
