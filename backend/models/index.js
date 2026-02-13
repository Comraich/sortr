const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env' });

// Initialize Sequelize
let sequelize;

if (process.env.DB_DIALECT === 'postgres') {
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './inventory.db',
    logging: false
  });
}

// Load models
const Location = require('./Location')(sequelize);
const Box = require('./Box')(sequelize);
const Item = require('./Item')(sequelize);
const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);

// Define relationships
Location.hasMany(Box, { foreignKey: 'locationId', onDelete: 'RESTRICT' });
Box.belongsTo(Location, { foreignKey: 'locationId' });
Box.hasMany(Item, { foreignKey: 'boxId', onDelete: 'SET NULL' });
Item.belongsTo(Box, { foreignKey: 'boxId' });

// Export sequelize instance and models
module.exports = {
  sequelize,
  Location,
  Box,
  Item,
  User,
  Category
};
