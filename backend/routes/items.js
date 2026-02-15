const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Item, Box, Location } = require('../models');
const { DEFAULT_QUERY_LIMIT } = require('../config/constants');

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
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('category').optional().trim(),
    body('description').optional().trim(),
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
    body('description').optional().trim(),
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

      const { filename } = req.params;

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
