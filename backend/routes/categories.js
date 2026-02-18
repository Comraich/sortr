const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Category } = require('../models');

// List all categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin only)
router.post('/',
  authenticateToken,
  [
    body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Category name is required and must be under 100 characters')
  ],
  validate,
  async (req, res) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    try {
      const category = await Category.create(req.body);
      res.json(category);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({ error: 'Category already exists' });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
);

// Update category (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const category = await Category.findByPk(req.params.id);
    if (category) {
      await category.update(req.body);
      res.json(category);
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    await category.destroy();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
