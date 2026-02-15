'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add parentId column to Locations table for hierarchy support
    await queryInterface.addColumn('Locations', 'parentId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Locations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for faster hierarchy queries
    await queryInterface.addIndex('Locations', ['parentId'], {
      name: 'locations_parent_id_index'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('Locations', 'locations_parent_id_index');

    // Remove parentId column
    await queryInterface.removeColumn('Locations', 'parentId');
  }
};
