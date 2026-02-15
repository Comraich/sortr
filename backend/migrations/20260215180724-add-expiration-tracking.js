'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add expirationDate column to Items table
    await queryInterface.addColumn('Items', 'expirationDate', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    // Add index for efficient expiration queries
    await queryInterface.addIndex('Items', ['expirationDate'], {
      name: 'items_expiration_date_index'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('Items', 'items_expiration_date_index');

    // Remove expirationDate column
    await queryInterface.removeColumn('Items', 'expirationDate');
  }
};
