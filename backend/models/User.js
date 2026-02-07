const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    githubId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    microsoftId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return User;
};
