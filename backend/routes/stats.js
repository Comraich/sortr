const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sequelize, Item, Box, Location, Category, Activity, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * GET /api/stats
 * Get comprehensive statistics about the inventory
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Run all queries in parallel for better performance
    const [
      totalItems,
      totalBoxes,
      totalLocations,
      totalCategories,
      itemsWithoutBox,
      itemsWithoutLocation,
      emptyBoxes,
      itemsByCategory,
      itemsByLocation,
      itemsByBox,
      recentItems,
      recentActivity
    ] = await Promise.all([
      // Total counts
      Item.count(),
      Box.count(),
      Location.count(),
      Category.count(),

      // Items without box/location
      Item.count({ where: { boxId: null } }),
      Item.count({ where: { locationId: null } }),

      // Empty boxes - using raw SQL
      sequelize.query(
        `SELECT b.id, b.name, l.name as locationName
         FROM Boxes b
         LEFT JOIN Items i ON b.id = i.boxId
         LEFT JOIN Locations l ON b.locationId = l.id
         GROUP BY b.id, b.name, l.name
         HAVING COUNT(i.id) = 0`,
        { type: Sequelize.QueryTypes.SELECT }
      ),

      // Items by category
      Item.findAll({
        attributes: [
          'category',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          category: { [Op.not]: null }
        },
        group: ['category'],
        order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      }),

      // Items by location - using raw SQL to avoid Sequelize complexity
      sequelize.query(
        `SELECT l.id, l.name, COUNT(i.id) as itemCount
         FROM Locations l
         LEFT JOIN Items i ON l.id = i.locationId
         GROUP BY l.id, l.name
         ORDER BY COUNT(i.id) DESC
         LIMIT 10`,
        { type: Sequelize.QueryTypes.SELECT }
      ),

      // Items per box (top 10 most filled) - using raw SQL
      sequelize.query(
        `SELECT b.id, b.name, l.name as locationName, COUNT(i.id) as itemCount
         FROM Boxes b
         LEFT JOIN Items i ON b.id = i.boxId
         LEFT JOIN Locations l ON b.locationId = l.id
         GROUP BY b.id, b.name, l.name
         HAVING COUNT(i.id) > 0
         ORDER BY COUNT(i.id) DESC
         LIMIT 10`,
        { type: Sequelize.QueryTypes.SELECT }
      ),

      // Recently added items
      Item.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Location,
            attributes: ['id', 'name']
          },
          {
            model: Box,
            attributes: ['id', 'name'],
            include: [{ model: Location, attributes: ['id', 'name'] }]
          }
        ]
      }),

      // Recent activity
      Activity.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }
        ]
      })
    ]);

    // Calculate storage utilization
    const averageItemsPerBox = totalBoxes > 0 ? (totalItems / totalBoxes).toFixed(2) : 0;
    const boxUtilization = totalBoxes > 0 ? ((totalBoxes - emptyBoxes.length) / totalBoxes * 100).toFixed(1) : 0;

    // Format the response
    const stats = {
      overview: {
        totalItems,
        totalBoxes,
        totalLocations,
        totalCategories,
        itemsWithoutBox,
        itemsWithoutLocation,
        emptyBoxesCount: emptyBoxes.length,
        averageItemsPerBox: parseFloat(averageItemsPerBox),
        boxUtilization: parseFloat(boxUtilization)
      },
      itemsByCategory: itemsByCategory.map(item => ({
        category: item.category,
        count: parseInt(item.count)
      })),
      itemsByLocation: itemsByLocation.map(loc => ({
        id: loc.id,
        name: loc.name,
        count: parseInt(loc.itemCount)
      })),
      topBoxes: itemsByBox.map(box => ({
        id: box.id,
        name: box.name,
        location: box.locationName || '-',
        count: parseInt(box.itemCount)
      })),
      emptyBoxes: emptyBoxes.map(box => ({
        id: box.id,
        name: box.name,
        location: box.locationName || '-'
      })),
      recentItems: recentItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        location: item.Box?.Location?.name || item.Location?.name || '-',
        box: item.Box?.name || '-',
        createdAt: item.createdAt
      })),
      recentActivity: recentActivity.slice(0, 5).map(activity => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityName: activity.entityName,
        user: activity.user?.username || 'System',
        createdAt: activity.createdAt
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats/trends
 * Get trends over time (items added per day for last 30 days)
 */
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get items created per day
    const itemsPerDay = await Item.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      trends: itemsPerDay.map(day => ({
        date: day.date,
        count: parseInt(day.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
