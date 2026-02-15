const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Share = sequelize.define('Share', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sharedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    resourceType: {
      type: DataTypes.ENUM('item', 'location', 'box'),
      allowNull: false
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    permission: {
      type: DataTypes.ENUM('view', 'edit'),
      allowNull: false,
      defaultValue: 'view'
    }
  });

  return Share;
};
