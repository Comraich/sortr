'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Items', 'tags', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Items', 'isFavorite', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Items', 'tags');
    await queryInterface.removeColumn('Items', 'isFavorite');
  }
};
