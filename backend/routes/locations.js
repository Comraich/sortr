const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Location, Box } = require('../models');

// List all locations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const locations = await Location.findAll({ order: [['name', 'ASC']] });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create location
router.post('/',
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
  }
);

// Update location
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (location) {
      await location.update(req.body);
      res.json(location);
    } else {
      res.status(404).json({ error: "Location not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete location
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
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

module.exports = router;
