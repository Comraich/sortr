const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Item, Box, Location } = require('../models');
const { DEFAULT_QUERY_LIMIT } = require('../config/constants');

// Create Item
router.post('/',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('category').optional().trim(),
    body('locationId').optional().isInt({ min: 1 }).withMessage('Valid location ID is required if provided'),
    body('boxId').optional().isInt({ min: 1 }).withMessage('Valid box ID is required if provided')
  ],
  validate,
  async (req, res) => {
    try {
      const item = await Item.create(req.body);
      const itemWithRelations = await Item.findByPk(item.id, {
        include: [
          { model: Location },
          { model: Box, include: [{ model: Location }] }
        ]
      });
      res.json(itemWithRelations);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Read All Items
router.get('/', authenticateToken, async (req, res) => {
  const offset = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || DEFAULT_QUERY_LIMIT;
  try {
    const items = await Item.findAll({
      offset,
      limit,
      include: [
        { model: Location },
        { model: Box, include: [{ model: Location }] }
      ]
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read One Item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, {
      include: [
        { model: Location },
        { model: Box, include: [{ model: Location }] }
      ]
    });
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Item
router.put('/:id',
  authenticateToken,
  [
    body('name').optional().trim().notEmpty().withMessage('Item name cannot be empty'),
    body('category').optional().trim(),
    body('locationId').optional().isInt({ min: 1 }).withMessage('Valid location ID is required if provided'),
    body('boxId').optional().isInt({ min: 1 }).withMessage('Valid box ID is required if provided')
  ],
  validate,
  async (req, res) => {
    try {
      const item = await Item.findByPk(req.params.id);
      if (item) {
        await item.update(req.body);
        const itemWithRelations = await Item.findByPk(item.id, {
          include: [
            { model: Location },
            { model: Box, include: [{ model: Location }] }
          ]
        });
        res.json(itemWithRelations);
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete Item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (item) {
      await item.destroy();
      res.json({ message: "Item deleted successfully" });
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
