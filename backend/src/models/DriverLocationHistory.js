const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DriverLocationHistory = sequelize.define('driver_location_history', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  driver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  order_id: DataTypes.INTEGER,
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'driver_location_history',
  timestamps: false,
});

module.exports = DriverLocationHistory;
