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

Store.hasMany(Category, { foreignKey: 'store_id', as: 'categories' });
Category.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Food, { foreignKey: 'store_id', as: 'foods' });
Category.hasMany(Food, { foreignKey: 'category_id', as: 'foods' });
Food.belongsTo(Category, { foreignKey: 'category_id' });
Food.belongsTo(Store, { foreignKey: 'store_id' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Store.hasMany(Order, { foreignKey: 'store_id', as: 'orders' });
Order.belongsTo(Store, { foreignKey: 'store_id' });

User.hasMany(Order, { foreignKey: 'driver_id', as: 'delivered_orders' });
Order.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Food.hasMany(OrderItem, { foreignKey: 'food_id' });
OrderItem.belongsTo(Food, { foreignKey: 'food_id' });

User.hasMany(DriverLocationHistory, { foreignKey: 'driver_id' });
DriverLocationHistory.belongsTo(User, { foreignKey: 'driver_id' });

Order.hasMany(DriverLocationHistory, { foreignKey: 'order_id' });
DriverLocationHistory.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(Rating, { foreignKey: 'order_id', as: 'ratings' });
Rating.belongsTo(Order, { foreignKey: 'order_id' });

User.hasMany(Rating, { foreignKey: 'user_id' });
Rating.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Rating, { foreignKey: 'driver_id', as: 'driver_ratings' });
Rating.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

Store.hasMany(Rating, { foreignKey: 'store_id' });
Rating.belongsTo(Store, { foreignKey: 'store_id' });

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
};
