const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Null if system-generated
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['create', 'update', 'delete', 'move', 'upload_image', 'delete_image']]
      }
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['item', 'box', 'location', 'user']]
      }
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true // Null if entity was deleted
    },
    entityName: {
      type: DataTypes.STRING,
      allowNull: true // Store name for reference even after deletion
    },
    changes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Before/after values: { before: {...}, after: {...} }'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Additional context: IP address, user agent, etc.'
    }
  }, {
    timestamps: true,
    updatedAt: false, // Activities are immutable once created
    indexes: [
      { fields: ['userId'] },
      { fields: ['entityType', 'entityId'] },
      { fields: ['action'] },
      { fields: ['createdAt'] }
    ]
  });

  Activity.associate = (models) => {
    Activity.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Activity;
};
