const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rating = sequelize.define('rating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  driver_id: DataTypes.INTEGER,
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rating_score: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  },
  comment: DataTypes.TEXT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ratings',
  timestamps: false,
});

module.exports = Rating;
