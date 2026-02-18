const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Box, Location, Item } = require('../models');

// List all boxes (optionally filter by locationId)
router.get('/', authenticateToken, async (req, res) => {
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
router.post('/',
  authenticateToken,
  [
    body('name').trim().notEmpty().isLength({ max: 255 }).withMessage('Box name is required and must be under 255 characters'),
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
  }
);

// Update box
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const box = await Box.findByPk(req.params.id);
    if (box) {
      await box.update(req.body);
      const boxWithLocation = await Box.findByPk(box.id, {
        include: [{ model: Location, attributes: ['id', 'name'] }]
      });
      res.json(boxWithLocation);
    } else {
      res.status(404).json({ error: "Box not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete box
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const box = await Box.findByPk(req.params.id);
    if (!box) {
      return res.status(404).json({ error: "Box not found" });
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

module.exports = router;
