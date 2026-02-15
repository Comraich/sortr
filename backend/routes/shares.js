const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Share, User, Item, Location, Box, Notification } = require('../models');

// Get all shares for current user (items shared with them)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shares = await Share.findAll({
      where: { userId: req.user.userId },
      include: [
        { model: User, as: 'sharedBy', attributes: ['id', 'username', 'displayName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Enrich shares with resource details
    const enrichedShares = await Promise.all(shares.map(async (share) => {
      let resource = null;
      try {
        if (share.resourceType === 'item') {
          resource = await Item.findByPk(share.resourceId);
        } else if (share.resourceType === 'location') {
          resource = await Location.findByPk(share.resourceId);
        } else if (share.resourceType === 'box') {
          resource = await Box.findByPk(share.resourceId);
        }
      } catch (e) {
        // Resource might have been deleted
      }

      return {
        ...share.toJSON(),
        resource
      };
    }));

    res.json(enrichedShares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new share
router.post('/',
  authenticateToken,
  [
    body('userId').isInt().withMessage('User ID is required'),
    body('resourceType').isIn(['item', 'location', 'box']).withMessage('Invalid resource type'),
    body('resourceId').isInt().withMessage('Resource ID is required'),
    body('permission').isIn(['view', 'edit']).withMessage('Permission must be view or edit')
  ],
  validate,
  async (req, res) => {
    try {
      const { userId, resourceType, resourceId, permission } = req.body;

      // Check if user exists
      const targetUser = await User.findByPk(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if resource exists
      let resource = null;
      if (resourceType === 'item') {
        resource = await Item.findByPk(resourceId);
      } else if (resourceType === 'location') {
        resource = await Location.findByPk(resourceId);
      } else if (resourceType === 'box') {
        resource = await Box.findByPk(resourceId);
      }

      if (!resource) {
        return res.status(404).json({ error: `${resourceType} not found` });
      }

      // Check if share already exists
      const existingShare = await Share.findOne({
        where: { userId, resourceType, resourceId }
      });

      if (existingShare) {
        // Update existing share
        await existingShare.update({ permission, sharedByUserId: req.user.userId });
        return res.json(existingShare);
      }

      // Create new share
      const share = await Share.create({
        userId,
        sharedByUserId: req.user.userId,
        resourceType,
        resourceId,
        permission
      });

      // Create notification for the user
      await Notification.create({
        userId,
        type: 'share',
        message: `${req.user.username} shared a ${resourceType} with you`,
        resourceType,
        resourceId
      });

      res.json(share);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete a share
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const share = await Share.findByPk(req.params.id);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Only the person who created the share or admin can delete it
    if (share.sharedByUserId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this share' });
    }

    await share.destroy();
    res.json({ message: 'Share deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shares for a specific resource (who has access)
router.get('/resource/:type/:id', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.params;

    if (!['item', 'location', 'box'].includes(type)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const shares = await Share.findAll({
      where: {
        resourceType: type,
        resourceId: parseInt(id)
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'displayName'] },
        { model: User, as: 'sharedBy', attributes: ['id', 'username', 'displayName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(shares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
