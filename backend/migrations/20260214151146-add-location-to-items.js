'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add locationId column to Items table
    await queryInterface.addColumn('Items', 'locationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Locations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Backfill locationId from boxId for existing items
    // Items with boxes will get the location from their box
    await queryInterface.sequelize.query(`
      UPDATE Items
      SET locationId = (
        SELECT Boxes.locationId
        FROM Boxes
        WHERE Boxes.id = Items.boxId
      )
      WHERE boxId IS NOT NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the locationId column
    await queryInterface.removeColumn('Items', 'locationId');
  }
};
