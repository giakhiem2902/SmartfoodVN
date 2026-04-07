const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  driver_id: DataTypes.INTEGER,
  status: {
    type: DataTypes.ENUM(
      'PENDING',
      'CONFIRMED',
      'FINDING_DRIVER',
      'DRIVER_ACCEPTED',
      'PICKING_UP',
      'DELIVERING',
      'COMPLETED',
      'CANCELLED'
    ),
    defaultValue: 'PENDING',
  },
  delivery_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  delivery_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  delivery_address: DataTypes.STRING(500),
  total_food_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  shipping_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  distance_km: DataTypes.DECIMAL(10, 2),
  notes: DataTypes.TEXT,
  payment_method: {
    type: DataTypes.ENUM('CASH', 'CARD', 'WALLET'),
    defaultValue: 'CASH',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  completed_at: DataTypes.DATE,
}, {
  tableName: 'orders',
  timestamps: false,
});

module.exports = Order;
