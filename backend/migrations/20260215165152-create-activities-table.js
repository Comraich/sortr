'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Activities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      entityName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      changes: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('Activities', ['userId']);
    await queryInterface.addIndex('Activities', ['entityType', 'entityId']);
    await queryInterface.addIndex('Activities', ['action']);
    await queryInterface.addIndex('Activities', ['createdAt']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Activities');
  }
};
