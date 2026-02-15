const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('share', 'comment', 'mention'),
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    resourceType: {
      type: DataTypes.ENUM('item', 'location', 'box'),
      allowNull: true
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

  return Notification;
};
