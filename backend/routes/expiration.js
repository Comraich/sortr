const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware');
const { Item, Location, Box, Notification } = require('../models');

// Get expired items
router.get('/expired', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const items = await Item.findAll({
      where: {
        expirationDate: {
          [Op.lt]: today
        }
      },
      include: [
        { model: Location, attributes: ['id', 'name'] },
        { model: Box, attributes: ['id', 'name'] }
      ],
      order: [['expirationDate', 'ASC']]
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expiring soon items (within specified days, default 7)
router.get('/expiring-soon', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const items = await Item.findAll({
      where: {
        expirationDate: {
          [Op.gte]: todayStr,
          [Op.lte]: futureDateStr
        }
      },
      include: [
        { model: Location, attributes: ['id', 'name'] },
        { model: Box, attributes: ['id', 'name'] }
      ],
      order: [['expirationDate', 'ASC']]
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all items with expiration dates
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const items = await Item.findAll({
      where: {
        expirationDate: {
          [Op.ne]: null
        }
      },
      include: [
        { model: Location, attributes: ['id', 'name'] },
        { model: Box, attributes: ['id', 'name'] }
      ],
      order: [['expirationDate', 'ASC']]
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check for expired items and create notifications (can be called by cron job)
router.post('/check-and-notify', authenticateToken, async (req, res) => {
  try {
    // Only admins can trigger notification checks
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get items expiring today or tomorrow
    const expiringItems = await Item.findAll({
      where: {
        expirationDate: {
          [Op.gte]: today,
          [Op.lte]: tomorrowStr
        }
      }
    });

    // Create notifications for users (simplified - notifies all users)
    // In a real system, you'd notify item owners or users with shared access
    const notificationsCreated = [];
    for (const item of expiringItems) {
      const daysUntilExpiration = Math.ceil(
        (new Date(item.expirationDate) - new Date(today)) / (1000 * 60 * 60 * 24)
      );

      const message = daysUntilExpiration === 0
        ? `"${item.name}" expires today!`
        : `"${item.name}" expires in ${daysUntilExpiration} day(s)`;

      // Note: In production, you'd want to notify specific users, not broadcast
      // For now, we'll just notify the current user
      await Notification.create({
        userId: req.user.userId,
        type: 'mention',
        message,
        resourceType: 'item',
        resourceId: item.id
      });

      notificationsCreated.push({ itemId: item.id, message });
    }

    res.json({
      message: 'Notification check complete',
      itemsChecked: expiringItems.length,
      notificationsCreated: notificationsCreated.length,
      notifications: notificationsCreated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
