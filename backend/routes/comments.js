const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, validate } = require('../middleware');
const { Comment, User, Item, Share, Notification } = require('../models');

// Get comments for an item
router.get('/item/:itemId', authenticateToken, async (req, res) => {
  try {
    // Verify the item exists before returning comments
    const item = await Item.findByPk(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const comments = await Comment.findAll({
      where: { itemId: req.params.itemId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a comment
router.post('/',
  authenticateToken,
  [
    body('itemId').isInt().withMessage('Item ID is required'),
    body('content').trim().notEmpty().isLength({ max: 2000 }).withMessage('Comment content is required and must be under 2000 characters')
  ],
  validate,
  async (req, res) => {
    try {
      const { itemId, content } = req.body;

      // Check if item exists
      const item = await Item.findByPk(itemId);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Create comment
      const comment = await Comment.create({
        userId: req.user.id,
        itemId,
        content
      });

      // Fetch comment with user info
      const createdComment = await Comment.findByPk(comment.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }
        ]
      });

      // Notify users who have access to this item (shares)
      const shares = await Share.findAll({
        where: {
          resourceType: 'item',
          resourceId: itemId
        }
      });

      for (const share of shares) {
        if (share.userId !== req.user.id) {
          await Notification.create({
            userId: share.userId,
            type: 'comment',
            message: `${req.user.username} commented on "${item.name}"`,
            resourceType: 'item',
            resourceId: itemId
          });
        }
      }

      res.json(createdComment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Update a comment
router.put('/:id',
  authenticateToken,
  [
    body('content').trim().notEmpty().isLength({ max: 2000 }).withMessage('Comment content is required and must be under 2000 characters')
  ],
  validate,
  async (req, res) => {
    try {
      const comment = await Comment.findByPk(req.params.id);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Only the comment author can update it
      if (comment.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this comment' });
      }

      await comment.update({ content: req.body.content });

      const updatedComment = await Comment.findByPk(comment.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'displayName'] }
        ]
      });

      res.json(updatedComment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete a comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only the comment author or admin can delete it
    if (comment.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
