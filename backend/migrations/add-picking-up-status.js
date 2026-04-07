/**
 * Migration: Add PICKING_UP to orders.status ENUM
 *
 * Run once against your MySQL database:
 *   node backend/migrations/add-picking-up-status.js
 */
'use strict';

const sequelize = require('../src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // MySQL ALTER TABLE to extend the ENUM
    await sequelize.query(`
      ALTER TABLE orders
      MODIFY COLUMN status ENUM(
        'PENDING',
        'CONFIRMED',
        'FINDING_DRIVER',
        'DRIVER_ACCEPTED',
        'PICKING_UP',
        'DELIVERING',
        'COMPLETED',
        'CANCELLED'
      ) NOT NULL DEFAULT 'PENDING';
    `);

    console.log('✅ Migration complete: PICKING_UP added to orders.status ENUM');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})();
