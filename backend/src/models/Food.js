const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Food = sequelize.define('food', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: DataTypes.TEXT,
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  image_url: DataTypes.STRING(500),
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  preparation_time: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'foods',
  timestamps: false,
});

module.exports = Food;
