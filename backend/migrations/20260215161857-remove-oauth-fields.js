'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove OAuth provider ID columns from Users table
    await queryInterface.removeColumn('Users', 'googleId');
    await queryInterface.removeColumn('Users', 'githubId');
    await queryInterface.removeColumn('Users', 'microsoftId');
  },

  async down (queryInterface, Sequelize) {
    // Restore OAuth provider ID columns if migration is rolled back
    await queryInterface.addColumn('Users', 'googleId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'githubId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'microsoftId', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
