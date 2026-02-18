const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Item, Box, Location } = require('../models');
const { DEFAULT_QUERY_LIMIT } = require('../config/constants');
const { logActivity, logCustomActivity } = require('../middleware/activityLogger');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Create Item
router.post('/',
  authenticateToken,
  [
    body('name').trim().notEmpty().isLength({ max: 255 }).withMessage('Item name is required and must be under 255 characters'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be under 100 characters'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    body('locationId').optional().isInt({ min: 1 }).withMessage('Valid location ID is required if provided'),
    body('boxId').optional().isInt({ min: 1 }).withMessage('Valid box ID is required if provided')
  ],
  validate,
  logActivity('item', 'create'),
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

// Read All Items (with advanced filtering)
router.get('/', authenticateToken, async (req, res) => {
  const offset = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || DEFAULT_QUERY_LIMIT;

  // Build filter conditions
  const where = {};
  const { Op } = require('sequelize');

  // Filter by category
  if (req.query.category) {
    where.category = req.query.category;
  }

  // Filter by location
  if (req.query.locationId) {
    // Items can be in a location directly OR through a box
    // We'll handle this in the include
  }

  // Filter by box
  if (req.query.boxId) {
    where.boxId = parseInt(req.query.boxId);
  }

  // Filter by hasBox (items with or without boxes)
  if (req.query.hasBox === 'true') {
    where.boxId = { [Op.not]: null };
  } else if (req.query.hasBox === 'false') {
    where.boxId = null;
  }

  // Filter by hasLocation (items with or without locations)
  if (req.query.hasLocation === 'true') {
    where.locationId = { [Op.not]: null };
  } else if (req.query.hasLocation === 'false') {
    where.locationId = null;
  }

  // Date range filters
  if (req.query.dateFrom || req.query.dateTo) {
    where.createdAt = {};
    if (req.query.dateFrom) {
      // Append time to parse as local midnight rather than UTC midnight
      where.createdAt[Op.gte] = new Date(`${req.query.dateFrom}T00:00:00`);
    }
    if (req.query.dateTo) {
      // Add one day to include the entire end date
      const endDate = new Date(`${req.query.dateTo}T00:00:00`);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt[Op.lt] = endDate;
    }
  }

  // Search query (searches name, category, description)
  if (req.query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { category: { [Op.like]: `%${req.query.search}%` } },
      { description: { [Op.like]: `%${req.query.search}%` } }
    ];
  }

  // Sorting
  let order = [['createdAt', 'DESC']]; // Default: newest first
  if (req.query.sortBy) {
    const sortField = req.query.sortBy;
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (['name', 'category', 'createdAt', 'updatedAt'].includes(sortField)) {
      order = [[sortField, sortOrder]];
    }
  }

  try {
    // Build include conditions
    const include = [
      {
        model: Location,
        required: false
      },
      {
        model: Box,
        include: [{ model: Location }],
        required: false
      }
    ];

    // If filtering by locationId, we need to check both direct location and box's location
    if (req.query.locationId) {
      const locationId = parseInt(req.query.locationId);
      const { literal } = require('sequelize');

      // Items are in this location if:
      // 1. Their locationId matches, OR
      // 2. Their box is in this location (subquery avoids a separate round-trip)
      where[Op.or] = [
        { locationId },
        { boxId: { [Op.in]: literal(`(SELECT id FROM Boxes WHERE locationId = ${locationId})`) } }
      ];
    }

    const items = await Item.findAll({
      where,
      offset,
      limit,
      include,
      order
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching items with filters:', error);
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
    body('name').optional().trim().notEmpty().isLength({ max: 255 }).withMessage('Item name cannot be empty and must be under 255 characters'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be under 100 characters'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    body('locationId').optional().isInt({ min: 1 }).withMessage('Valid location ID is required if provided'),
    body('boxId').optional().isInt({ min: 1 }).withMessage('Valid box ID is required if provided')
  ],
  validate,
  logActivity('item', 'update'),
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
      // Log activity before deletion
      await logCustomActivity({
        userId: req.user?.id,
        action: 'delete',
        entityType: 'item',
        entityId: item.id,
        entityName: item.name,
        changes: {
          deleted: {
            name: item.name,
            category: item.category,
            boxId: item.boxId,
            locationId: item.locationId
          }
        },
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      // Delete associated images from filesystem
      if (item.images && Array.isArray(item.images)) {
        for (const filename of item.images) {
          try {
            await fs.unlink(path.join('uploads', filename));
          } catch (err) {
            console.error(`Error deleting image ${filename}:`, err);
          }
        }
      }

      await item.destroy();
      res.json({ message: "Item deleted successfully" });
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload images for an item
router.post('/:id/images',
  authenticateToken,
  upload.array('images', 5), // Allow up to 5 images at once
  async (req, res) => {
    try {
      const item = await Item.findByPk(req.params.id);
      if (!item) {
        // Clean up uploaded files if item not found
        if (req.files) {
          for (const file of req.files) {
            await fs.unlink(file.path).catch(err => console.error(err));
          }
        }
        return res.status(404).json({ error: "Item not found" });
      }

      // Get current images or initialize empty array
      const currentImages = item.images || [];

      // Add new image filenames
      const newImages = req.files.map(file => file.filename);
      const updatedImages = [...currentImages, ...newImages];

      // Limit to 5 images total
      if (updatedImages.length > 5) {
        // Clean up excess files
        const excessFiles = newImages.slice(5 - currentImages.length);
        for (const filename of excessFiles) {
          await fs.unlink(path.join('uploads', filename)).catch(err => console.error(err));
        }
        return res.status(400).json({ error: 'Maximum 5 images allowed per item' });
      }

      // Update item with new images
      await item.update({ images: updatedImages });

      // Log activity
      await logCustomActivity({
        userId: req.user?.id,
        action: 'upload_image',
        entityType: 'item',
        entityId: item.id,
        entityName: item.name,
        changes: {
          imagesAdded: newImages,
          totalImages: updatedImages.length
        },
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      res.json({
        message: 'Images uploaded successfully',
        images: updatedImages
      });
    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(err => console.error(err));
        }
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete a specific image from an item
router.delete('/:id/images/:filename',
  authenticateToken,
  async (req, res) => {
    try {
      const item = await Item.findByPk(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      const filename = path.basename(req.params.filename);

      // Check if image exists in item's images array
      if (!item.images || !item.images.includes(filename)) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Remove image from array
      const updatedImages = item.images.filter(img => img !== filename);
      await item.update({ images: updatedImages.length > 0 ? updatedImages : null });

      // Delete file from filesystem
      try {
        await fs.unlink(path.join('uploads', filename));
      } catch (err) {
        console.error(`Error deleting file ${filename}:`, err);
      }

      // Log activity
      await logCustomActivity({
        userId: req.user?.id,
        action: 'delete_image',
        entityType: 'item',
        entityId: item.id,
        entityName: item.name,
        changes: {
          imageDeleted: filename,
          remainingImages: updatedImages.length
        },
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      res.json({
        message: 'Image deleted successfully',
        images: updatedImages
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
