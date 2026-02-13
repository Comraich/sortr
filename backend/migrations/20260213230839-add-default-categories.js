'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Categories table
    await queryInterface.createTable('Categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Insert default categories
    const defaultCategories = [
      'Electronics',
      'Clothing',
      'Books',
      'Kitchen',
      'Tools',
      'Toys',
      'Sports',
      'Office',
      'Bathroom',
      'Garage',
      'Garden',
      'Furniture',
      'Decorations',
      'Cleaning',
      'Food',
      'Other'
    ];

    const now = new Date();
    const categories = defaultCategories.map(name => ({
      name,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('Categories', categories);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Categories');
  }
};
