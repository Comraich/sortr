const express = require('express');
const router = express.Router();
const FuzzySet = require('fuzzyset.js');
const { authenticateToken } = require('../middleware/auth');
const { Item, Box, Location, Category } = require('../models');
const { Op } = require('sequelize');

// Category keyword mappings
const CATEGORY_KEYWORDS = {
  'Electronics': ['phone', 'laptop', 'computer', 'tablet', 'charger', 'cable', 'headphone', 'speaker', 'monitor', 'keyboard', 'mouse', 'camera', 'tv', 'remote', 'battery', 'adapter', 'usb', 'hdmi'],
  'Kitchen': ['plate', 'cup', 'bowl', 'knife', 'fork', 'spoon', 'pan', 'pot', 'kettle', 'blender', 'toaster', 'microwave', 'oven', 'refrigerator', 'dish', 'glass', 'mug'],
  'Clothing': ['shirt', 'pants', 'dress', 'shoe', 'sock', 'jacket', 'coat', 'sweater', 'hat', 'glove', 'scarf', 'belt', 'tie', 'shorts', 'skirt', 'jeans'],
  'Books': ['book', 'novel', 'magazine', 'journal', 'textbook', 'manual', 'guide', 'dictionary', 'encyclopedia', 'comic', 'manga'],
  'Tools': ['hammer', 'screwdriver', 'wrench', 'drill', 'saw', 'pliers', 'tape', 'nail', 'screw', 'bolt', 'level', 'ruler', 'measure'],
  'Toys': ['toy', 'game', 'puzzle', 'doll', 'action figure', 'lego', 'board game', 'card', 'dice', 'ball', 'stuffed'],
  'Sports': ['ball', 'bat', 'racket', 'club', 'bike', 'skate', 'helmet', 'glove', 'shoe', 'weight', 'yoga', 'fitness', 'gym'],
  'Office': ['pen', 'pencil', 'paper', 'notebook', 'folder', 'binder', 'stapler', 'clip', 'tape', 'marker', 'highlighter', 'envelope', 'label'],
  'Cleaning': ['soap', 'detergent', 'cleaner', 'sponge', 'brush', 'mop', 'broom', 'vacuum', 'duster', 'polish', 'wipe', 'sanitizer'],
  'Garden': ['seed', 'plant', 'pot', 'soil', 'fertilizer', 'hose', 'sprinkler', 'shovel', 'rake', 'glove', 'shear', 'trimmer'],
  'Bathroom': ['towel', 'soap', 'shampoo', 'toothbrush', 'toothpaste', 'razor', 'comb', 'brush', 'tissue', 'toilet paper'],
  'Furniture': ['chair', 'table', 'desk', 'shelf', 'cabinet', 'drawer', 'bed', 'couch', 'sofa', 'lamp', 'mirror']
};

/**
 * GET /api/suggestions/category
 * Suggest category based on item name
 */
router.get('/category', authenticateToken, async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.json({ suggestions: [] });
    }

    const nameLower = name.toLowerCase();
    const suggestions = [];

    // Check keyword mappings
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (nameLower.includes(keyword)) {
          suggestions.push({
            category,
            confidence: 0.8,
            reason: `Contains keyword: ${keyword}`
          });
          break; // Only add once per category
        }
      }
    }

    // Get categories from existing items with similar names
    const similarItems = await Item.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`
        },
        category: {
          [Op.not]: null
        }
      },
      attributes: ['category'],
      group: ['category'],
      limit: 3
    });

    for (const item of similarItems) {
      if (!suggestions.find(s => s.category === item.category)) {
        suggestions.push({
          category: item.category,
          confidence: 0.6,
          reason: 'Based on similar items'
        });
      }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    res.json({ suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    console.error('Error suggesting category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/suggestions/similar/:id
 * Find similar items to the given item
 */
router.get('/similar/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Find items with same category
    const whereClause = {
      id: { [Op.not]: item.id }
    };

    if (item.category) {
      whereClause.category = item.category;
    }

    const candidates = await Item.findAll({
      where: whereClause,
      include: [
        { model: Location, attributes: ['id', 'name'] },
        { model: Box, attributes: ['id', 'name'], include: [{ model: Location, attributes: ['id', 'name'] }] }
      ],
      limit: 50
    });

    // Calculate similarity scores using fuzzy matching
    const itemNames = candidates.map(c => c.name);
    const fuzzySet = FuzzySet(itemNames);
    const matches = fuzzySet.get(item.name, null, 0.3); // Min score 0.3

    let similar = [];
    if (matches) {
      similar = matches.map(([score, name]) => {
        const candidate = candidates.find(c => c.name === name);
        return {
          id: candidate.id,
          name: candidate.name,
          category: candidate.category,
          location: candidate.Box?.Location?.name || candidate.Location?.name || '-',
          box: candidate.Box?.name || '-',
          similarity: (score * 100).toFixed(0) + '%'
        };
      }).slice(0, 5);
    }

    res.json({ similar });
  } catch (error) {
    console.error('Error finding similar items:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/suggestions/duplicates
 * Check for potential duplicates when adding/editing an item
 */
router.get('/duplicates', authenticateToken, async (req, res) => {
  try {
    const { name, excludeId } = req.query;

    if (!name || name.length < 3) {
      return res.json({ duplicates: [] });
    }

    // Find items with similar names
    const whereClause = {
      name: {
        [Op.like]: `%${name}%`
      }
    };

    if (excludeId) {
      whereClause.id = { [Op.not]: parseInt(excludeId, 10) };
    }

    const candidates = await Item.findAll({
      where: whereClause,
      include: [
        { model: Location, attributes: ['id', 'name'] },
        { model: Box, attributes: ['id', 'name'], include: [{ model: Location, attributes: ['id', 'name'] }] }
      ],
      limit: 20
    });

    if (candidates.length === 0) {
      return res.json({ duplicates: [] });
    }

    // Use fuzzy matching to find close matches
    const itemNames = candidates.map(c => c.name);
    const fuzzySet = FuzzySet(itemNames);
    const matches = fuzzySet.get(name, null, 0.7); // Higher threshold for duplicates

    let duplicates = [];
    if (matches) {
      duplicates = matches.map(([score, matchName]) => {
        const candidate = candidates.find(c => c.name === matchName);
        return {
          id: candidate.id,
          name: candidate.name,
          category: candidate.category,
          location: candidate.Box?.Location?.name || candidate.Location?.name || '-',
          box: candidate.Box?.name || '-',
          similarity: (score * 100).toFixed(0) + '%'
        };
      }).slice(0, 5);
    }

    res.json({ duplicates });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/suggestions/empty-boxes
 * Suggest empty boxes in a specific location
 */
router.get('/empty-boxes', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.query;
    const { Sequelize } = require('sequelize');

    const whereClause = {};
    if (locationId) {
      whereClause.locationId = parseInt(locationId, 10);
    }

    // Find boxes with no items
    const emptyBoxes = await Box.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'locationId'],
      include: [
        {
          model: Item,
          attributes: [],
          required: false
        },
        {
          model: Location,
          attributes: ['id', 'name']
        }
      ],
      group: ['Box.id', 'Location.id'],
      having: Sequelize.literal('COUNT(Items.id) = 0'),
      raw: false,
      limit: 10
    });

    const suggestions = emptyBoxes.map(box => ({
      id: box.id,
      name: box.name,
      location: box.Location?.name || '-',
      locationId: box.locationId
    }));

    res.json({ emptyBoxes: suggestions });
  } catch (error) {
    console.error('Error finding empty boxes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/suggestions/autocomplete
 * Autocomplete item names based on existing items
 */
router.get('/autocomplete', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const items = await Item.findAll({
      where: {
        name: {
          [Op.like]: `${query}%`
        }
      },
      attributes: ['name', 'category'],
      group: ['name', 'category'],
      limit: parseInt(limit, 10),
      order: [['name', 'ASC']]
    });

    const suggestions = items.map(item => ({
      name: item.name,
      category: item.category
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Error autocompleting:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/suggestions/box-for-item
 * Suggest which box to put an item in based on category and location
 */
router.get('/box-for-item', authenticateToken, async (req, res) => {
  try {
    const { category, locationId } = req.query;

    if (!category) {
      return res.json({ suggestions: [] });
    }

    const { Sequelize } = require('sequelize');

    // Find boxes that contain items of the same category
    const whereClause = {
      category
    };

    if (locationId) {
      // Find boxes in the same location
      const boxesInLocation = await Box.findAll({
        where: { locationId: parseInt(locationId, 10) },
        attributes: ['id']
      });
      const boxIds = boxesInLocation.map(b => b.id);
      whereClause.boxId = { [Op.in]: boxIds };
    }

    const itemsInCategory = await Item.findAll({
      where: whereClause,
      attributes: [
        'boxId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'itemCount']
      ],
      include: [
        {
          model: Box,
          attributes: ['id', 'name'],
          include: [{ model: Location, attributes: ['name'] }]
        }
      ],
      group: ['boxId', 'Box.id', 'Box->Location.id'],
      having: Sequelize.literal('boxId IS NOT NULL'),
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: false
    });

    const suggestions = itemsInCategory.map(item => ({
      boxId: item.boxId,
      boxName: item.Box?.name || '-',
      location: item.Box?.Location?.name || '-',
      itemCount: parseInt(item.get('itemCount')),
      reason: `Already has ${item.get('itemCount')} ${category} items`
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting box:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
