const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Location, Box } = require('../models');

// List all locations (with parent info)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const locations = await Location.findAll({
      include: [
        { model: Location, as: 'parent', attributes: ['id', 'name'] },
        { model: Location, as: 'children', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create location
router.post('/',
  authenticateToken,
  [
    body('name').trim().notEmpty().isLength({ max: 255 }).withMessage('Location name is required and must be under 255 characters'),
    body('parentId').optional().isInt().withMessage('Parent ID must be an integer')
  ],
  validate,
  async (req, res) => {
    try {
      // Validate parent exists if provided
      if (req.body.parentId) {
        const parent = await Location.findByPk(req.body.parentId);
        if (!parent) {
          return res.status(400).json({ error: 'Parent location not found' });
        }
      }
      const location = await Location.create(req.body);
      res.json(location);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Helper function to check for circular references
async function wouldCreateCircularReference(locationId, newParentId) {
  if (!newParentId) return false;
  if (locationId === newParentId) return true;

  let currentId = newParentId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId)) return true; // Circular reference in existing structure
    if (currentId === locationId) return true; // Would create circular reference

    visited.add(currentId);
    const parent = await Location.findByPk(currentId);
    currentId = parent?.parentId;
  }

  return false;
}

// Update location
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Validate parent exists and no circular reference
    if (req.body.parentId !== undefined) {
      if (req.body.parentId) {
        const parent = await Location.findByPk(req.body.parentId);
        if (!parent) {
          return res.status(400).json({ error: 'Parent location not found' });
        }

        const circular = await wouldCreateCircularReference(parseInt(req.params.id, 10), req.body.parentId);
        if (circular) {
          return res.status(400).json({ error: 'Cannot create circular reference in location hierarchy' });
        }
      }
    }

    await location.update(req.body);
    res.json(location);
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

    // Check for child locations
    const childCount = await Location.count({ where: { parentId: req.params.id } });
    if (childCount > 0) {
      return res.status(400).json({ error: `Cannot delete location with ${childCount} child location(s). Remove or reassign children first.` });
    }

    // Check for boxes
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
