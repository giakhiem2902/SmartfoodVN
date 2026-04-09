const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoreRegistration = sequelize.define('store_registration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  store_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  store_address: DataTypes.STRING(500),
  store_phone: DataTypes.STRING(20),
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  business_type: DataTypes.STRING(100),
  store_image_url: DataTypes.STRING(500),
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  rejection_reason: DataTypes.TEXT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'store_registrations',
  timestamps: false,
});

module.exports = StoreRegistration;
