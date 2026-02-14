'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add email column (without unique constraint initially for SQLite compatibility)
    await queryInterface.addColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add displayName column
    await queryInterface.addColumn('Users', 'displayName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add isAdmin column
    await queryInterface.addColumn('Users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Add unique index on email column (works in SQLite)
    await queryInterface.addIndex('Users', ['email'], {
      unique: true,
      name: 'users_email_unique',
      where: { email: { [Sequelize.Op.ne]: null } }
    });

    // Backfill: Make the first user (ID=1) an admin
    await queryInterface.sequelize.query(
      'UPDATE Users SET isAdmin = 1 WHERE id = (SELECT MIN(id) FROM Users)'
    );

    // Backfill: For OAuth users, try to populate email from username if it contains @
    await queryInterface.sequelize.query(`
      UPDATE Users
      SET email = username
      WHERE email IS NULL
      AND username LIKE '%@%'
      AND (googleId IS NOT NULL OR githubId IS NOT NULL OR microsoftId IS NOT NULL)
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the unique index first
    await queryInterface.removeIndex('Users', 'users_email_unique');

    // Remove the three columns in reverse order
    await queryInterface.removeColumn('Users', 'isAdmin');
    await queryInterface.removeColumn('Users', 'displayName');
    await queryInterface.removeColumn('Users', 'email');
  }
};
