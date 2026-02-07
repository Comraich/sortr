const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Box = sequelize.define('Box', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  return Box;
};
