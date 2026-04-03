const sequelize = require('../src/config/database');

(async () => {
  try {
    await sequelize.query(`
      ALTER TABLE foods ADD COLUMN is_hot BOOLEAN DEFAULT FALSE AFTER is_featured;
    `);
    console.log('✅ Added is_hot column to foods table');
    process.exit(0);
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('✅ Column is_hot already exists');
      process.exit(0);
    }
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
})();
