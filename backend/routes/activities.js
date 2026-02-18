const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Activity, User } = require('../models');
const { Op } = require('sequelize');
const { DEFAULT_QUERY_LIMIT } = require('../config/constants');

/**
 * GET /api/activities
 * Get all activities with filtering and pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const offset = parseInt(req.query.skip, 10) || 0;
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_QUERY_LIMIT, 100);

    const where = {};

    // Filter by user (non-admins can only see their own activities)
    if (req.query.userId) {
      const requestedId = parseInt(req.query.userId, 10);
      if (!req.user.isAdmin && requestedId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to view other users\' activities' });
      }
      where.userId = requestedId;
    } else if (!req.user.isAdmin) {
      where.userId = req.user.id;
    }

    // Filter by entity type
    if (req.query.entityType) {
      where.entityType = req.query.entityType;
    }

    // Filter by entity ID
    if (req.query.entityId) {
      where.entityId = parseInt(req.query.entityId);
    }

    // Filter by action
    if (req.query.action) {
      where.action = req.query.action;
    }

    // Date range filters
    if (req.query.dateFrom || req.query.dateTo) {
      where.createdAt = {};
      if (req.query.dateFrom) {
        where.createdAt[Op.gte] = new Date(`${req.query.dateFrom}T00:00:00`);
      }
      if (req.query.dateTo) {
        const endDate = new Date(`${req.query.dateTo}T00:00:00`);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt[Op.lt] = endDate;
      }
    }

    const activities = await Activity.findAll({
      where,
      offset,
      limit,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activities/recent
 * Get recent activities (last 24 hours by default)
 */
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours, 10) || 24;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const since = new Date();
    since.setHours(since.getHours() - hours);

    const activities = await Activity.findAll({
      where: {
        createdAt: {
          [Op.gte]: since
        }
      },
      limit,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activities/entity/:type/:id
 * Get all activities for a specific entity
 */
router.get('/entity/:type/:id', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const activities = await Activity.findAll({
      where: {
        entityType: type,
        entityId: parseInt(id)
      },
      limit,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching entity activities:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activities/stats
 * Get activity statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { Sequelize } = require('sequelize');
    const { sequelize } = require('../models');

    // Get total activities
    const total = await Activity.count();

    // Get activities by action
    const byAction = await Activity.findAll({
      attributes: [
        'action',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['action']
    });

    // Get activities by entity type
    const byEntityType = await Activity.findAll({
      attributes: [
        'entityType',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['entityType']
    });

    // Get most active users
    const byUser = await Activity.findAll({
      attributes: [
        'userId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        userId: {
          [Op.not]: null
        }
      },
      group: ['userId'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      total,
      byAction: byAction.map(a => ({ action: a.action, count: parseInt(a.get('count')) })),
      byEntityType: byEntityType.map(a => ({ entityType: a.entityType, count: parseInt(a.get('count')) })),
      topUsers: byUser.map(a => ({
        userId: a.userId,
        username: a.user?.username,
        count: parseInt(a.get('count'))
      }))
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
