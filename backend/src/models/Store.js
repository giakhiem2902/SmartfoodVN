const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define('store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address: DataTypes.STRING(500),
  phone: DataTypes.STRING(20),
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  opening_time: DataTypes.TIME,
  closing_time: DataTypes.TIME,
  description: DataTypes.TEXT,
  image_url: DataTypes.STRING(500),
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'stores',
  timestamps: false,
});

module.exports = Store;
