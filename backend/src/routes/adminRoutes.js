const express = require('express');
const { User, Order, Food, Store, Category, OrderItem, StoreRegistration, sequelize } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../config/multer');

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

    // Reverse role map to display proper names
    const roleDisplayMap = {
      'user': 'Customer',
      'driver': 'Driver',
      'store': 'Store Owner',
      'admin': 'Admin'
    };

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.username,
      email: user.email,
      phone: user.phone,
      role: roleDisplayMap[user.role] || user.role,
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
    
    // Normalize role values from frontend format to database format
    const roleMap = {
      'Customer': 'user',
      'Driver': 'driver',
      'Store Owner': 'store',
      'Admin': 'admin'
    };
    
    const dbRole = roleMap[role] || role.toLowerCase();
    
    const user = await User.create({
      username: name,
      email,
      phone,
      role: dbRole,
      is_online: status === 'Active',
      password: 'temp123456',
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error in POST /users:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Normalize role values from frontend format to database format
    const roleMap = {
      'Customer': 'user',
      'Driver': 'driver',
      'Store Owner': 'store',
      'Admin': 'admin'
    };
    
    const dbRole = req.body.role ? (roleMap[req.body.role] || req.body.role.toLowerCase()) : user.role;

    await user.update({
      username: req.body.name || user.username,
      email: req.body.email || user.email,
      phone: req.body.phone || user.phone,
      role: dbRole,
      is_online: req.body.status === 'Active',
    });

    res.json(user);
  } catch (error) {
    console.error('Error in PUT /users/:id:', error);
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

    const formattedFoods = foods.map((food) => {
      const imageUrl = food.image_url 
        ? (food.image_url.startsWith('http') ? food.image_url : `http://localhost:5000${food.image_url}`)
        : 'https://via.placeholder.com/100';
      
      return {
        id: food.id,
        name: food.name,
        category_id: food.category_id,
        store_id: food.store_id,
        category: food.category?.name || 'Unknown',
        store: food.store?.name || 'Unknown',
        price: food.price,
        isHot: food.is_hot || false,
        image: imageUrl,
        rating: food.rating || 0,
        status: food.is_available ? 'Active' : 'Inactive',
        is_active: food.is_available,
      };
    });

    res.json(formattedFoods);
  } catch (error) {
    console.error('Error in GET /foods:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/foods', auth, checkAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, category_id, store_id, price, is_hot, status } = req.body;
    
    if (!name || !category_id || !store_id || !price) {
      return res.status(400).json({ error: 'Missing required fields: name, category_id, store_id, price' });
    }

    const imageUrl = req.file ? `/uploads/foods/${req.file.filename}` : null;

    const food = await Food.create({
      name,
      price: parseFloat(price),
      is_hot: is_hot === true || is_hot === 'true',
      is_available: status === 'Active',
      category_id: parseInt(category_id),
      store_id: parseInt(store_id),
      image_url: imageUrl,
    });
    res.status(201).json(food);
  } catch (error) {
    console.error('Error in POST /foods:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/foods/:id', auth, checkAdmin, upload.single('image'), async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    const imageUrl = req.file ? `/uploads/foods/${req.file.filename}` : food.image_url;

    await food.update({
      name: req.body.name || food.name,
      price: req.body.price ? parseFloat(req.body.price) : food.price,
      is_hot: req.body.is_hot !== undefined ? req.body.is_hot : food.is_hot,
      is_available: req.body.status === 'Active',
      category_id: req.body.category_id || food.category_id,
      store_id: req.body.store_id || food.store_id,
      image_url: imageUrl,
    });

    res.json(food);
  } catch (error) {
    console.error('Error in PUT /foods/:id:', error);
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

    const statusDisplayMap = {
      'PENDING': 'Pending',
      'CONFIRMED': 'Confirmed',
      'FINDING_DRIVER': 'Finding Driver',
      'DRIVER_ACCEPTED': 'Driver Accepted',
      'PICKING_UP': 'Picking Up',
      'DELIVERING': 'Delivering',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
    };

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customer: order.user?.username || 'Unknown',
      store: order.store?.name || 'Unknown',
      amount: order.total_price,
      status: statusDisplayMap[order.status] || order.status,
      paymentMethod: order.payment_method || 'Cash',
      driver: order.driver?.username || 'Chưa có',
      orderDate: new Date(order.created_at).toLocaleDateString('vi-VN'),
      deliveryTime: '30 mins',
      items: 0,
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error in /orders endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/statistics', auth, checkAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const completedOrders = await Order.count({
      where: { status: 'COMPLETED' },
    });
    const pendingOrders = await Order.count({
      where: { 
        [Op.or]: [
          { status: 'PENDING' },
          { status: 'CONFIRMED' },
          { status: 'FINDING_DRIVER' },
          { status: 'DRIVER_ACCEPTED' },
          { status: 'PICKING_UP' },
          { status: 'DELIVERING' }
        ]
      },
    });
    const cancelledOrders = await Order.count({
      where: { status: 'CANCELLED' },
    });

    res.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
    });
  } catch (error) {
    console.error('Error in /orders/statistics:', error);
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

    // Normalize status values - accept both uppercase and Title case
    const statusMap = {
      'pending': 'PENDING',
      'Pending': 'PENDING',
      'confirmed': 'CONFIRMED',
      'Confirmed': 'CONFIRMED',
      'finding_driver': 'FINDING_DRIVER',
      'driver_accepted': 'DRIVER_ACCEPTED',
      'picking_up': 'PICKING_UP',
      'Picking Up': 'PICKING_UP',
      'delivering': 'DELIVERING',
      'Delivering': 'DELIVERING',
      'completed': 'COMPLETED',
      'Completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
      'Cancelled': 'CANCELLED',
    };

    const dbStatus = statusMap[req.body.status] || req.body.status.toUpperCase();

    await order.update({ status: dbStatus });
    res.json(order);
  } catch (error) {
    console.error('Error in PUT /orders/:id/status:', error);
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
      owner_id: store.owner_id,
      phone: store.phone || store.owner?.phone || 'N/A',
      email: store.owner?.email || 'N/A',
      address: store.address || '',
      city: 'N/A', // Since stores table doesn't have city column
      rating: 0,
      reviews: 0,
      status: store.is_active ? 'Active' : 'Inactive',
      foods: store.foods?.length || 0,
      avgDelivery: '30 mins',
    }));

    res.json(formattedStores);
  } catch (error) {
    console.error('Error in GET /stores:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/stores', auth, checkAdmin, async (req, res) => {
  try {
    const { name, owner_id, phone, email, address, status } = req.body;
    
    // Support both owner_id and owner field names
    const ownerIdValue = owner_id || req.body.owner;
    
    if (!name || !ownerIdValue) {
      return res.status(400).json({ error: 'Missing required fields: name, owner_id' });
    }

    const store = await Store.create({
      name,
      address: address || '',
      phone: phone || '',
      is_active: status === 'Active',
      owner_id: parseInt(ownerIdValue),
      lat: 0, // Default latitude
      lng: 0, // Default longitude
    });
    res.status(201).json(store);
  } catch (error) {
    console.error('Error in POST /stores:', error);
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
      phone: req.body.phone || store.phone,
      is_active: req.body.status === 'Active',
      // Note: owner_id and city not editable for safety
    });

    res.json(store);
  } catch (error) {
    console.error('Error in PUT /stores/:id:', error);
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
// Get categories by store (PHẢI ĐẶT TRƯỚC /:id để tránh conflict)
router.get('/categories-by-store/:storeId', auth, checkAdmin, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const categories = await Category.findAll({
      where: { store_id: storeId },
      include: [{ model: Food, as: 'foods', attributes: ['id'] }],
    });

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      icon: '📦',
      foods: cat.foods?.length || 0,
      status: 'Active',
      store_id: cat.store_id,
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Error in GET /categories-by-store/:storeId:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
router.get('/categories', auth, checkAdmin, async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Food, as: 'foods', attributes: ['id'] }],
    });

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      icon: '📦', // Default icon since model doesn't store it
      foods: cat.foods?.length || 0,
      status: 'Active', // Categories are always active by default
      store_id: cat.store_id,
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', auth, checkAdmin, async (req, res) => {
  try {
    const { name, description, store_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    let finalStoreId = store_id;
    
    // If store_id not provided, get the first store from database
    if (!finalStoreId) {
      const firstStore = await Store.findOne({ order: [['id', 'ASC']] });
      if (!firstStore) {
        return res.status(400).json({ error: 'No stores exist in database. Please create a store first.' });
      }
      finalStoreId = firstStore.id;
    }

    const category = await Category.create({
      name,
      description: description || '',
      store_id: parseInt(finalStoreId),
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error in POST /categories:', error);
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
      // Note: icon and is_active not supported in current schema
    });

    res.json(category);
  } catch (error) {
    console.error('Error in PUT /categories/:id:', error);
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

// ============= STORE REGISTRATIONS MANAGEMENT =============
// Get all store registration applications
router.get('/store-registrations', auth, checkAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const registrations = await StoreRegistration.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'phone', 'role'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const formattedRegistrations = registrations.map((reg) => ({
      id: reg.id,
      applicantName: reg.user?.username || 'Unknown',
      applicantEmail: reg.user?.email || 'N/A',
      applicantPhone: reg.user?.phone || 'N/A',
      storeName: reg.store_name,
      businessType: reg.business_type,
      address: reg.store_address,
      phone: reg.store_phone,
      lat: reg.lat,
      lng: reg.lng,
      status: reg.status,
      rejectionReason: reg.rejection_reason,
      image: reg.store_image_url,
      submittedAt: reg.created_at,
      updatedAt: reg.updated_at,
      userId: reg.user_id,
    }));

    res.json(formattedRegistrations);
  } catch (error) {
    console.error('Error in GET /store-registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update store registration status (approve/reject)
router.patch('/store-registrations/:id', auth, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be PENDING, APPROVED, or REJECTED' });
    }

    const registration = await StoreRegistration.findByPk(id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const user = await User.findByPk(registration.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let store = null;

    // If approving, create or update store
    if (status === 'APPROVED') {
      // Check if user already has a store
      store = await Store.findOne({ where: { owner_id: user.id } });

      const storePayload = {
        owner_id: user.id,
        name: registration.store_name,
        address: registration.store_address,
        phone: registration.store_phone || user.phone,
        lat: registration.lat,
        lng: registration.lng,
        description: registration.business_type,
        image_url: registration.store_image_url,
        is_active: true,
      };

      if (store) {
        // Update existing store
        await store.update(storePayload);
      } else {
        // Create new store
        store = await Store.create(storePayload);
      }

      // Update user role to store if not already
      if (user.role !== 'store') {
        await user.update({ role: 'store' });
      }
    }

    // Update registration status
    await registration.update({
      status,
      rejection_reason: status === 'REJECTED' ? (rejectionReason || null) : null,
    });

    res.json({
      message: `Registration ${status.toLowerCase()} successfully`,
      registration,
      store,
    });
  } catch (error) {
    console.error('Error in PATCH /store-registrations/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint - ensure default store exists
router.get('/health', async (req, res) => {
  try {
    const storeCount = await Store.count();
    if (storeCount === 0) {
      // Create default store if none exist
      const firstUser = await User.findOne({ where: { role: 'admin' } });
      if (firstUser) {
        await Store.create({
          owner_id: firstUser.id,
          name: 'Default Store',
          address: 'Default Address',
          phone: '0000000000',
          lat: 10.7769,
          lng: 106.6966,
          is_active: true,
        });
      }
    }
    res.json({ status: 'ok', stores: storeCount });
  } catch (error) {
    console.error('Error in /health:', error);
    res.json({ status: 'ok' });
  }
});

module.exports = router;
