// Index file for Models - manages all relationships
const User = require('./User');
const Store = require('./Store');
const Category = require('./Category');
const Food = require('./Food');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const DriverLocationHistory = require('./DriverLocationHistory');
const Rating = require('./Rating');
const StoreRegistration = require('./StoreRegistration');

// Define Associations
User.hasMany(Store, { foreignKey: 'owner_id', as: 'stores' });
Store.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

User.hasMany(StoreRegistration, { foreignKey: 'user_id', as: 'store_registrations' });
StoreRegistration.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Store -> Category with cascade delete
Store.hasMany(Category, { foreignKey: 'store_id', as: 'categories', onDelete: 'CASCADE' });
Category.belongsTo(Store, { foreignKey: 'store_id', onDelete: 'CASCADE' });

// Store -> Food with cascade delete
Store.hasMany(Food, { foreignKey: 'store_id', as: 'foods', onDelete: 'CASCADE' });
// Category -> Food with cascade delete
Category.hasMany(Food, { foreignKey: 'category_id', as: 'foods', onDelete: 'CASCADE' });
Food.belongsTo(Category, { foreignKey: 'category_id', as: 'category', onDelete: 'CASCADE' });
Food.belongsTo(Store, { foreignKey: 'store_id', as: 'store', onDelete: 'CASCADE' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });

Store.hasMany(Order, { foreignKey: 'store_id', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(Store, { foreignKey: 'store_id', as: 'store', onDelete: 'CASCADE' });

User.hasMany(Order, { foreignKey: 'driver_id', as: 'delivered_orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'driver_id', as: 'driver', onDelete: 'CASCADE' });

// Order -> OrderItem with cascade delete
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

Food.hasMany(OrderItem, { foreignKey: 'food_id', onDelete: 'CASCADE' });
OrderItem.belongsTo(Food, { foreignKey: 'food_id', onDelete: 'CASCADE' });

User.hasMany(DriverLocationHistory, { foreignKey: 'driver_id', onDelete: 'CASCADE' });
DriverLocationHistory.belongsTo(User, { foreignKey: 'driver_id', onDelete: 'CASCADE' });

Order.hasMany(DriverLocationHistory, { foreignKey: 'order_id', onDelete: 'CASCADE' });
DriverLocationHistory.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

Order.hasMany(Rating, { foreignKey: 'order_id', as: 'ratings', onDelete: 'CASCADE' });
Rating.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

User.hasMany(Rating, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Rating.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

User.hasMany(Rating, { foreignKey: 'driver_id', as: 'driver_ratings', onDelete: 'CASCADE' });
Rating.belongsTo(User, { foreignKey: 'driver_id', as: 'driver', onDelete: 'CASCADE' });

Store.hasMany(Rating, { foreignKey: 'store_id', onDelete: 'CASCADE' });
Rating.belongsTo(Store, { foreignKey: 'store_id', onDelete: 'CASCADE' });

module.exports = {
  User,
  Store,
  Category,
  Food,
  Order,
  OrderItem,
  DriverLocationHistory,
  Rating,
  StoreRegistration,
  sequelize: require('../config/database'),
};
