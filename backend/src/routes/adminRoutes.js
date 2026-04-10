const express = require('express');
const { User, Order, Food, Store, Category, OrderItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Middleware to check admin role
const checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// ============= STATISTICS =============
router.get('/statistics', auth, checkAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count().catch(() => 0);
    const totalOrders = await Order.count().catch(() => 0);
    
    let totalRevenue = 0;
    try {
      const revenueResult = await Order.sum('total_price', {
        where: { status: 'COMPLETED' },
      });
      totalRevenue = revenueResult || 0;
    } catch (e) {
      totalRevenue = 0;
    }

    const activeDrivers = await User.count({
      where: { role: 'driver', is_online: true },
    }).catch(() => 0);

    res.json({
      totalUsers: totalUsers || 0,
      totalOrders: totalOrders || 0,
      totalRevenue: totalRevenue || 0,
      activeDrivers: activeDrivers || 0,
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/chart', auth, checkAdmin, async (req, res) => {
  try {
    const days = 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'revenue'],
      ],
      where: {
        created_at: { [Op.gte]: startDate },
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      raw: true,
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    });

    const formattedData = orders.map((order) => ({
      date: new Date(order.date).toLocaleDateString('vi-VN'),
      orders: parseInt(order.orders) || 0,
      revenue: Math.round(parseInt(order.revenue) / 1000) || 0,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error in /orders/chart endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recent orders
router.get('/orders/recent', auth, checkAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'phone'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] },
      ],
      limit: 5,
      order: [['created_at', 'DESC']],
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customer: order.user?.username || 'Unknown',
      store: order.store?.name || 'Unknown',
      amount: order.total_price,
      status: order.status,
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= USERS MANAGEMENT =============
router.get('/users', auth, checkAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'phone', 'role', 'is_online', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.is_online ? 'Active' : 'Inactive',
      joinDate: new Date(user.created_at).toLocaleDateString('vi-VN'),
      orders: 0,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error in /users endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', auth, checkAdmin, async (req, res) => {
  try {
    const { name, email, phone, role, status } = req.body;
    const user = await User.create({
      username: name,
      email,
      phone,
      role,
      is_online: status === 'Active',
      password: 'temp123456',
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({
      username: req.body.name || user.username,
      email: req.body.email || user.email,
      phone: req.body.phone || user.phone,
      role: req.body.role || user.role,
      is_online: req.body.status === 'Active',
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= FOODS MANAGEMENT =============
router.get('/foods', auth, checkAdmin, async (req, res) => {
  try {
    const foods = await Food.findAll({
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] },
      ],
    });

    const formattedFoods = foods.map((food) => ({
      id: food.id,
      name: food.name,
      category: food.category?.name || 'Unknown',
      store: food.store?.name || 'Unknown',
      price: food.price,
      isHot: food.is_hot || false,
      image: food.image_url || 'https://via.placeholder.com/100',
      rating: food.rating || 0,
      status: food.is_active ? 'Active' : 'Inactive',
    }));

    res.json(formattedFoods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/foods', auth, checkAdmin, async (req, res) => {
  try {
    const { name, category_id, store_id, price, is_hot, status } = req.body;
    const food = await Food.create({
      name,
      price,
      is_hot: is_hot === true || is_hot === 'true',
      is_active: status === 'Active',
      category_id,
      store_id,
    });
    res.status(201).json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/foods/:id', auth, checkAdmin, async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    await food.update({
      name: req.body.name || food.name,
      price: req.body.price || food.price,
      is_hot: req.body.is_hot !== undefined ? req.body.is_hot : food.is_hot,
      is_active: req.body.status === 'Active',
      category_id: req.body.category_id || food.category_id,
      store_id: req.body.store_id || food.store_id,
    });

    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/foods/:id', auth, checkAdmin, async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    await food.destroy();
    res.json({ message: 'Food deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ORDERS MANAGEMENT =============
router.get('/orders', auth, checkAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] },
        { model: User, as: 'driver', attributes: ['id', 'username'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customer: order.user?.username || 'Unknown',
      store: order.store?.name || 'Unknown',
      amount: order.total_price,
      status: order.status,
      paymentMethod: order.payment_method || 'Cash',
      driver: order.driver?.username || 'Chưa có',
      orderDate: new Date(order.created_at).toLocaleDateString('vi-VN'),
      deliveryTime: '30 mins',
      items: 0,
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/statistics', auth, checkAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const completedOrders = await Order.count({
      where: { status: 'Completed' },
    });
    const pendingOrders = await Order.count({
      where: { status: ['Pending', 'Confirmed'] },
    });
    const cancelledOrders = await Order.count({
      where: { status: 'Cancelled' },
    });

    res.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detailed statistics endpoint - empty for now
router.get('/statistics/detailed', auth, checkAdmin, async (req, res) => {
  try {
    // Get top 10 foods by order quantity
    const topFoodsRaw = await sequelize.query(`
      SELECT f.id, f.name, COUNT(oi.id) as quantity, SUM(oi.price) as revenue
      FROM order_items oi
      JOIN foods f ON oi.food_id = f.id
      GROUP BY f.id, f.name
      ORDER BY quantity DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    const formattedFoods = topFoodsRaw.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: parseInt(item.quantity) || 0,
      revenue: parseInt(item.revenue) || 0,
    }));

    // Get top 10 stores by order count
    const topStoresRaw = await sequelize.query(`
      SELECT s.id, s.name, COUNT(o.id) as orders, SUM(o.total_price) as revenue
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE o.status = 'COMPLETED'
      GROUP BY s.id, s.name
      ORDER BY orders DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    const formattedStores = topStoresRaw.map((item) => ({
      id: item.id,
      name: item.name,
      orders: parseInt(item.orders) || 0,
      revenue: parseInt(item.revenue) || 0,
    }));

    // Get order status distribution
    const orderStatsRaw = await sequelize.query(`
      SELECT status, COUNT(id) as count
      FROM orders
      GROUP BY status
    `, { type: sequelize.QueryTypes.SELECT });

    const formattedOrderStats = orderStatsRaw.map((stat) => ({
      status: stat.status || 'UNKNOWN',
      value: parseInt(stat.count) || 0,
    }));

    res.json({
      topFoods: formattedFoods,
      topStores: formattedStores,
      orderStats: formattedOrderStats,
    });
  } catch (error) {
    console.error('Error in /statistics/detailed:', error);
    res.json({
      topFoods: [],
      topStores: [],
      orderStats: [],
    });
  }
});

// Get key metrics
router.get('/statistics/metrics', auth, checkAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalDrivers = await User.count({ where: { role: 'driver' } });
    const totalStores = await Store.count();
    const totalFoods = await Food.count();

    res.json({
      totalUsers,
      totalDrivers,
      totalStores,
      totalFoods,
    });
  } catch (error) {
    console.error('Error in /statistics/metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/orders/:id/status', auth, checkAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await order.update({ status: req.body.status });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= STORES MANAGEMENT =============
router.get('/stores', auth, checkAdmin, async (req, res) => {
  try {
    const stores = await Store.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'phone', 'email'] },
        { model: Food, as: 'foods', attributes: ['id'] },
      ],
    });

    const formattedStores = stores.map((store) => ({
      id: store.id,
      name: store.name,
      owner: store.owner?.username || 'Unknown',
      phone: store.owner?.phone || 'N/A',
      email: store.owner?.email || 'N/A',
      address: store.address || '',
      city: store.city || 'N/A',
      rating: store.rating || 0,
      reviews: 0,
      status: store.is_active ? 'Active' : 'Inactive',
      foods: store.foods?.length || 0,
      avgDelivery: '30 mins',
    }));

    res.json(formattedStores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stores', auth, checkAdmin, async (req, res) => {
  try {
    const { name, owner, phone, email, address, city, status } = req.body;
    const store = await Store.create({
      name,
      address,
      city,
      is_active: status === 'Active',
      owner_id: owner,
    });
    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/stores/:id', auth, checkAdmin, async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    await store.update({
      name: req.body.name || store.name,
      address: req.body.address || store.address,
      city: req.body.city || store.city,
      is_active: req.body.status === 'Active',
    });

    res.json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/stores/:id', auth, checkAdmin, async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    await store.destroy();
    res.json({ message: 'Store deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= CATEGORIES MANAGEMENT =============
router.get('/categories', auth, checkAdmin, async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Food, as: 'foods', attributes: ['id'] }],
    });

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '📦',
      foods: cat.foods?.length || 0,
      status: cat.is_active ? 'Active' : 'Inactive',
    }));

    res.json(formattedCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', auth, checkAdmin, async (req, res) => {
  try {
    const { name, description, icon, status } = req.body;
    const category = await Category.create({
      name,
      description,
      icon,
      is_active: status === 'Active',
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/categories/:id', auth, checkAdmin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.update({
      name: req.body.name || category.name,
      description: req.body.description || category.description,
      icon: req.body.icon || category.icon,
      is_active: req.body.status === 'Active',
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/categories/:id', auth, checkAdmin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SETTINGS =============
router.put('/settings', auth, checkAdmin, async (req, res) => {
  try {
    // Store settings in a settings table or config file
    // For now, just return success
    res.json({ message: 'Settings updated', data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
