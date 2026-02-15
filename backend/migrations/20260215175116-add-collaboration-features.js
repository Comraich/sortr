'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create Shares table
    await queryInterface.createTable('Shares', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sharedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      resourceType: {
        type: Sequelize.ENUM('item', 'location', 'box'),
        allowNull: false
      },
      resourceId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      permission: {
        type: Sequelize.ENUM('view', 'edit'),
        allowNull: false,
        defaultValue: 'view'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Comments table
    await queryInterface.createTable('Comments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Notifications table
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('share', 'comment', 'mention'),
        allowNull: false
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false
      },
      resourceType: {
        type: Sequelize.ENUM('item', 'location', 'box'),
        allowNull: true
      },
      resourceId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('Shares', ['userId']);
    await queryInterface.addIndex('Shares', ['resourceType', 'resourceId']);
    await queryInterface.addIndex('Comments', ['itemId']);
    await queryInterface.addIndex('Notifications', ['userId', 'isRead']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Notifications');
    await queryInterface.dropTable('Comments');
    await queryInterface.dropTable('Shares');
  }
};
