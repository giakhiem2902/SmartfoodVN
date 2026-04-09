const path = require('path');
const { Sequelize } = require('sequelize');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const sequelize = new Sequelize(
  process.env.DB_NAME || 'smartfood',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    charset: 'utf8mb4',
    dialectOptions: {
      charset: 'utf8mb4',
    },
    logging: false,
    define: {
      timestamps: false,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Unable to connect to the database:', err));

module.exports = sequelize;
