# Database Migrations Guide

This project now has Sequelize migrations set up for safer database schema management.

## Why Migrations?

Instead of using `sequelize.sync({ alter: true })` which can cause data loss, migrations provide:
- Version control for your database schema
- Safer production deployments
- Ability to roll back changes
- Clear history of schema changes

## Current Status

⚠️ **The app still uses `sync({ alter: true })` for backward compatibility.**

To fully transition to migrations:

1. **Back up your database** (copy `inventory.db` to a safe location)
2. Run the initial migration (creates the schema if it doesn't exist)
3. Update `server.js` to remove the sync() call

## Running Migrations

### Create a new migration
```bash
cd backend
npx sequelize-cli migration:generate --name describe-your-change
```

### Run pending migrations
```bash
npx sequelize-cli db:migrate
```

### Undo last migration
```bash
npx sequelize-cli db:migrate:undo
```

### Check migration status
```bash
npx sequelize-cli db:migrate:status
```

## Initial Migration (When Ready to Transition)

An initial migration file has been created in `migrations/` that defines the current schema:
- Users table
- Locations table
- Boxes table
- Items table

### To Activate Migrations:

1. **Backup your database first!**
   ```bash
   cp inventory.db inventory.db.backup
   ```

2. Run the initial migration:
   ```bash
   npx sequelize-cli db:migrate
   ```

3. Update `server.js` - change line ~108:
   ```javascript
   // OLD (unsafe for production):
   sequelize.sync({ alter: true })

   // NEW (safe):
   sequelize.sync() // Just sync without altering
   ```

4. Restart your server

## Creating Future Migrations

When you need to change the schema (add column, new table, etc.):

```bash
# 1. Generate migration file
npx sequelize-cli migration:generate --name add-quantity-to-items

# 2. Edit the generated file in migrations/ folder
# 3. Run migration
npx sequelize-cli db:migrate

# 4. If something went wrong, undo it
npx sequelize-cli db:migrate:undo
```

## Example Migration

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Items', 'quantity', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Items', 'quantity');
  }
};
```

## Best Practices

1. **Always test migrations on a backup first**
2. **Never edit old migrations** - create new ones to fix issues
3. **Run migrations before deploying** to production
4. **Keep migrations small and focused** on one change
5. **Write both `up` and `down` methods** for reversibility

## Troubleshooting

### "Table already exists" error
The table exists from sync(). Either:
- Drop the database and start fresh with migrations
- Or continue using sync() until you're ready to transition

### Migration failed partway
```bash
npx sequelize-cli db:migrate:undo
# Fix the migration file
npx sequelize-cli db:migrate
```
