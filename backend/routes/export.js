const express = require('express');
const router = express.Router();
const { createObjectCsvStringifier } = require('csv-writer');
const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');
const { Readable } = require('stream');
const { authenticateToken } = require('../middleware/auth');
const { Item, Box, Location, User, Category } = require('../models');

// Configure multer for CSV uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/export/csv
 * Export items to CSV
 */
router.post('/csv', authenticateToken, async (req, res) => {
  try {
    // Get filter params from request body
    const { filters } = req.body;

    // Build where clause (similar to items.js filtering)
    const where = {};
    const { Op } = require('sequelize');

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.boxId) {
      where.boxId = parseInt(filters.boxId);
    }
    if (filters?.locationId) {
      // This would need the same logic as items.js for location filtering
      where.locationId = parseInt(filters.locationId);
    }

    // Fetch items
    const items = await Item.findAll({
      where,
      include: [
        { model: Location },
        { model: Box, include: [{ model: Location }] }
      ],
      order: [['name', 'ASC']]
    });

    // Prepare CSV data
    const csvData = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category || '',
      description: item.description || '',
      location: item.Box?.Location?.name || item.Location?.name || '',
      box: item.Box?.name || '',
      boxId: item.boxId || '',
      locationId: item.locationId || '',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    // Create CSV stringifier
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' },
        { id: 'category', title: 'Category' },
        { id: 'description', title: 'Description' },
        { id: 'location', title: 'Location' },
        { id: 'box', title: 'Box' },
        { id: 'boxId', title: 'Box ID' },
        { id: 'locationId', title: 'Location ID' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);

    // Send CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-export-${Date.now()}.csv"`);
    res.send(csvString);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/import/csv
 * Import items from CSV (with preview mode)
 */
router.post('/csv-import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const preview = req.query.preview === 'true';
    const results = [];
    const errors = [];

    // Convert buffer to readable stream
    const bufferStream = Readable.from(req.file.buffer);

    // Parse CSV
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Validate rows
    const validatedResults = [];
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNum = i + 2; // Account for header row

      // Validate required fields
      if (!row.name || row.name.trim() === '') {
        errors.push({ row: rowNum, field: 'name', message: 'Name is required' });
        continue;
      }

      // Validate boxId if provided
      if (row.boxId && row.boxId.trim() !== '') {
        const boxId = parseInt(row.boxId);
        if (isNaN(boxId)) {
          errors.push({ row: rowNum, field: 'boxId', message: 'Box ID must be a number' });
          continue;
        }
        const boxExists = await Box.findByPk(boxId);
        if (!boxExists) {
          errors.push({ row: rowNum, field: 'boxId', message: `Box with ID ${boxId} not found` });
          continue;
        }
      }

      // Validate locationId if provided
      if (row.locationId && row.locationId.trim() !== '') {
        const locationId = parseInt(row.locationId);
        if (isNaN(locationId)) {
          errors.push({ row: rowNum, field: 'locationId', message: 'Location ID must be a number' });
          continue;
        }
        const locationExists = await Location.findByPk(locationId);
        if (!locationExists) {
          errors.push({ row: rowNum, field: 'locationId', message: `Location with ID ${locationId} not found` });
          continue;
        }
      }

      validatedResults.push({
        name: row.name.trim(),
        category: row.category?.trim() || null,
        description: row.description?.trim() || null,
        boxId: row.boxId?.trim() ? parseInt(row.boxId) : null,
        locationId: row.locationId?.trim() ? parseInt(row.locationId) : null
      });
    }

    // If preview mode, return validation results
    if (preview) {
      return res.json({
        preview: true,
        totalRows: results.length,
        validRows: validatedResults.length,
        errorCount: errors.length,
        errors,
        sampleRows: validatedResults.slice(0, 5) // Show first 5 valid rows
      });
    }

    // If not preview, import the data
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errors,
        message: `Found ${errors.length} errors. Fix them and try again.`
      });
    }

    const createdItems = await Item.bulkCreate(validatedResults);

    res.json({
      success: true,
      imported: createdItems.length,
      message: `Successfully imported ${createdItems.length} items`
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/json
 * Export full database as JSON backup
 */
router.get('/json', authenticateToken, async (req, res) => {
  try {
    const [items, boxes, locations, categories] = await Promise.all([
      Item.findAll({ include: [{ model: Location }, { model: Box }] }),
      Box.findAll({ include: [{ model: Location }] }),
      Location.findAll(),
      Category.findAll()
    ]);

    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        locations,
        boxes,
        items,
        categories
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="sortr-backup-${Date.now()}.json"`);
    res.json(backup);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/template
 * Download CSV template for imports
 */
router.get('/template', authenticateToken, (req, res) => {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'name', title: 'Name' },
      { id: 'category', title: 'Category' },
      { id: 'description', title: 'Description' },
      { id: 'boxId', title: 'Box ID' },
      { id: 'locationId', title: 'Location ID' }
    ]
  });

  // Sample data
  const sampleData = [
    { name: 'Example Item 1', category: 'Electronics', description: 'A sample electronic item', boxId: '1', locationId: '1' },
    { name: 'Example Item 2', category: 'Tools', description: 'A sample tool', boxId: '2', locationId: '1' }
  ];

  const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(sampleData);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="import-template.csv"');
  res.send(csvString);
});

module.exports = router;
