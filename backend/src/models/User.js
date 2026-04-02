const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('user', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    validate: {
      len: [3, 100],
    },
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // Cho phép null với Google OAuth users (không có password thật)
  },
  role: {
    type: DataTypes.ENUM('user', 'store', 'driver', 'admin'),
    defaultValue: 'user',
  },
  phone: DataTypes.STRING(20),
  lat: DataTypes.DECIMAL(10, 8),
  lng: DataTypes.DECIMAL(11, 8),
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  google_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
  },
  image_url: DataTypes.STRING(500),
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  two_factor_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  backup_codes: {
    type: DataTypes.TEXT, // Lưu JSON array các mã backup đã hash
    allowNull: true,
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
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

User.prototype.validatePassword = async function(password) {
  if (!this.password) {
    // Google OAuth user - không có password
    return false;
  }
  return await bcrypt.compare(password, this.password);
};

module.exports = User;
