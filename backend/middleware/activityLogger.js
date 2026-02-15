const { Activity } = require('../models');

/**
 * Middleware to log activities for create/update/delete operations
 *
 * Usage:
 * router.post('/', authenticateToken, logActivity('item', 'create'), async (req, res) => { ... })
 *
 * @param {string} entityType - Type of entity: 'item', 'box', 'location', 'user'
 * @param {string} action - Action performed: 'create', 'update', 'delete', 'move'
 * @param {function} getEntityId - Optional function to extract entity ID from req/res
 * @param {function} getChanges - Optional function to extract changes from req/res
 */
function logActivity(entityType, action, options = {}) {
  return async (req, res, next) => {
    // Store original functions
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Track if we've already logged
    let hasLogged = false;

    const performLogging = async (data) => {
      if (hasLogged) return;
      hasLogged = true;

      try {
        const userId = req.user?.id || null;

        // Extract entity ID
        let entityId;
        if (options.getEntityId) {
          entityId = options.getEntityId(req, res, data);
        } else if (action === 'create' && data?.id) {
          entityId = data.id;
        } else if (req.params?.id) {
          entityId = parseInt(req.params.id);
        }

        // Extract entity name
        let entityName;
        if (options.getEntityName) {
          entityName = options.getEntityName(req, res, data);
        } else if (data?.name) {
          entityName = data.name;
        } else if (req.body?.name) {
          entityName = req.body.name;
        }

        // Extract changes
        let changes = null;
        if (options.getChanges) {
          changes = options.getChanges(req, res, data);
        } else if (action === 'update' && req.body) {
          // For updates, store what fields were changed
          changes = {
            fields: Object.keys(req.body)
          };
        } else if (action === 'delete' && data) {
          // For deletes, store the deleted entity data
          changes = {
            deleted: data
          };
        }

        // Create activity log
        await Activity.create({
          userId,
          action,
          entityType,
          entityId,
          entityName,
          changes,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent')
          }
        });
      } catch (error) {
        // Log error but don't fail the request
        console.error('Failed to log activity:', error);
      }
    };

    // Wrap res.json
    res.json = function(data) {
      performLogging(data).finally(() => {
        originalJson(data);
      });
    };

    // Wrap res.send for non-JSON responses
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        performLogging(data).finally(() => {
          originalSend(data);
        });
      } else {
        originalSend(data);
      }
    };

    next();
  };
}

/**
 * Helper to log bulk operations
 */
async function logBulkActivity(userId, action, entityType, entities) {
  try {
    const activities = entities.map(entity => ({
      userId,
      action,
      entityType,
      entityId: entity.id,
      entityName: entity.name,
      metadata: {}
    }));

    await Activity.bulkCreate(activities);
  } catch (error) {
    console.error('Failed to log bulk activity:', error);
  }
}

/**
 * Manual activity logging for complex operations
 */
async function logCustomActivity(data) {
  try {
    await Activity.create(data);
  } catch (error) {
    console.error('Failed to log custom activity:', error);
  }
}

module.exports = {
  logActivity,
  logBulkActivity,
  logCustomActivity
};
