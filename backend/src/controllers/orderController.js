const { Order, OrderItem, Food, Store } = require('../models');
const { Op } = require('sequelize');
const { createOrder, getOrderDetails, updateOrderStatus, assignDriverToOrder } = require('../services/orderService');
const { findAvailableDrivers } = require('../services/locationService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const sequelize = require('../config/database');

// Create order
const checkout = async (req, res, next) => {
  try {
    const { storeId, items, deliveryLat, deliveryLng, deliveryAddress, notes, paymentMethod } = req.body;
    const userId = req.user.id;

    console.log('=== CHECKOUT REQUEST ===');
    console.log('StoreId received:', storeId, 'Type:', typeof storeId);
    console.log('Items:', items);
    console.log('Full request body:', req.body);

    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Store ID and items array are required', 400);
    }

    if (deliveryLat === undefined || deliveryLng === undefined) {
      return sendError(res, 'Delivery coordinates are required', 400);
    }

    const order = await createOrder(
      userId,
      storeId,
      items,
      deliveryLat,
      deliveryLng,
      deliveryAddress,
      notes,
      paymentMethod || 'CASH'
    );

    console.log('Order created:', order.id, 'with store_id:', order.store_id);
    sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

// Get order by ID
const getOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderDetails(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const store = await Store.findByPk(order.store_id);
    const isStoreOwner = store && Number(store.owner_id) === Number(req.user.id);

    // Check authorization
    if (req.user.role !== 'admin' && order.user_id !== req.user.id && order.driver_id !== req.user.id && !isStoreOwner) {
      return sendError(res, 'Unauthorized to view this order', 403);
    }

    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
};

// Get user orders
const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await Order.findAll({
      where: { user_id: userId },
      include: [
        {
          association: 'store',
          attributes: ['id', 'name', 'address', 'phone', 'lat', 'lng'],
        },
        {
          association: 'driver',
          attributes: ['id', 'username', 'phone', 'lat', 'lng', 'is_online'],
        },
        {
          association: 'items',
          include: [
            {
              model: Food,
              attributes: ['id', 'name', 'price', 'image_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
};

// Get store orders
const getStoreOrders = async (req, res, next) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findByPk(storeId);
    if (!store) {
      return sendError(res, 'Store not found', 404);
    }

    if (req.user.role !== 'admin' && Number(store.owner_id) !== Number(req.user.id)) {
      return sendError(res, 'Unauthorized to view this store orders', 403);
    }

    const orders = await Order.findAll({
      where: { store_id: storeId },
      include: [
        {
          association: 'user',
          attributes: ['id', 'username', 'phone', 'email'],
        },
        {
          association: 'driver',
          attributes: ['id', 'username', 'phone', 'is_online'],
        },
        {
          association: 'items',
          include: [{ model: Food, attributes: ['id', 'name', 'price', 'image_url'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
};

// Update order status
const updateStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return sendError(res, 'Status is required', 400);
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const store = await Store.findByPk(order.store_id);
    const isStoreOwner = store && Number(store.owner_id) === Number(req.user.id);
    const isDriverOwner = Number(order.driver_id) === Number(req.user.id);
    const isCustomer = Number(order.user_id) === Number(req.user.id);

    const roleAllowedStatuses = {
      admin: ['PENDING', 'CONFIRMED', 'FINDING_DRIVER', 'DRIVER_ACCEPTED', 'PICKING_UP', 'DELIVERING', 'COMPLETED', 'CANCELLED'],
      store: ['CONFIRMED', 'FINDING_DRIVER', 'PICKING_UP', 'DELIVERING', 'CANCELLED'],
      driver: ['PICKING_UP', 'DELIVERING', 'COMPLETED'],
      user: ['CANCELLED'],
    };

    const validNextStatuses = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['FINDING_DRIVER', 'CANCELLED'],
      FINDING_DRIVER: ['DRIVER_ACCEPTED', 'CANCELLED'],
      DRIVER_ACCEPTED: ['PICKING_UP', 'DELIVERING', 'CANCELLED'],
      PICKING_UP: ['DELIVERING', 'CANCELLED'],
      DELIVERING: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!roleAllowedStatuses[req.user.role]?.includes(status)) {
      return sendError(res, 'This role cannot update to the requested status', 403);
    }

    if (req.user.role === 'store' && !isStoreOwner) {
      return sendError(res, 'Only the store owner can update this order', 403);
    }

    if (req.user.role === 'driver' && !isDriverOwner) {
      return sendError(res, 'Only the assigned driver can update this order', 403);
    }

    if (req.user.role === 'user' && !isCustomer) {
      return sendError(res, 'Unauthorized to update this order', 403);
    }

    if (req.user.role !== 'admin' && !validNextStatuses[order.status]?.includes(status)) {
      return sendError(res, `Cannot move order from ${order.status} to ${status}`, 400);
    }

    const updatedOrder = await updateOrderStatus(orderId, status);
    sendSuccess(res, updatedOrder, 'Order status updated');
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

// Accept order as driver
const acceptOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (req.user.role !== 'driver') {
      return sendError(res, 'Only drivers can accept orders', 403);
    }

    const existingOrder = await Order.findByPk(orderId);
    if (!existingOrder) {
      return sendError(res, 'Order not found', 404);
    }

    if (existingOrder.status !== 'FINDING_DRIVER') {
      return sendError(res, 'Order is not ready for driver assignment', 400);
    }

    const order = await assignDriverToOrder(orderId, req.user.id);
    sendSuccess(res, order, 'Order accepted');
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404);
    }
    next(error);
  }
};

// Get available orders for driver (optionally filtered by driver location within radius km)
const getAvailableOrders = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver') {
      return sendError(res, 'Only drivers can view available orders', 403);
    }

    const { lat, lng, radius } = req.query; // driver's current coords + search radius (km)

    // Always include store info so the mobile map can show store markers
    const orders = await Order.findAll({
      where: { status: 'FINDING_DRIVER' },
      include: [
        {
          association: 'store',
          attributes: ['id', 'name', 'address', 'lat', 'lng', 'phone'],
        },
        {
          association: 'items',
          include: [{ model: Food, attributes: ['id', 'name', 'price', 'image_url'] }],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    // If driver sends their coordinates, filter & annotate with distance_to_store
    if (lat && lng) {
      const driverLat = parseFloat(lat);
      const driverLng = parseFloat(lng);
      const maxKm = parseFloat(radius) || 10;

      const { calculateDistance } = require('../utils/geoUtils');

      const nearby = orders
        .map((o) => {
          const plain = o.toJSON();
          if (plain.store) {
            const dist = calculateDistance(
              driverLat, driverLng,
              parseFloat(plain.store.lat),
              parseFloat(plain.store.lng)
            );
            plain.distance_to_store = Math.round(dist * 10) / 10; // km, 1 decimal
            return plain;
          }
          plain.distance_to_store = null;
          return plain;
        })
        .filter((o) => o.distance_to_store === null || o.distance_to_store <= maxKm)
        .sort((a, b) => (a.distance_to_store ?? 99) - (b.distance_to_store ?? 99));

      return sendSuccess(res, nearby);
    }

    sendSuccess(res, orders.map((o) => o.toJSON()));
  } catch (error) {
    next(error);
  }
};

// Get driver orders (active deliveries)
const getDriverOrders = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver') {
      return sendError(res, 'Only drivers can view their orders', 403);
    }

    const orders = await Order.findAll({
      where: {
        driver_id: req.user.id,
        status: { [Op.in]: ['DRIVER_ACCEPTED', 'PICKING_UP', 'DELIVERING'] },
      },
      include: [
        {
          association: 'store',
          attributes: ['id', 'name', 'address', 'lat', 'lng', 'phone'],
        },
        {
          association: 'user',
          attributes: ['id', 'username', 'phone', 'lat', 'lng'],
        },
        {
          association: 'items',
          include: [{ model: Food, attributes: ['id', 'name', 'price', 'image_url'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
};

// Get daily revenue (admin/store owner)
const getDailyRevenue = async (req, res, next) => {
  try {
    const { storeId, date } = req.query;

    if (!storeId) {
      return sendError(res, 'Store ID is required', 400);
    }

    const revenueData = await sequelize.query(`
      SELECT 
        DATE(o.created_at) as order_date,
        COUNT(o.id) as total_orders,
        SUM(o.total_food_price) as total_food_price,
        SUM(o.shipping_fee) as total_shipping_fee,
        SUM(o.total_price) as total_revenue
      FROM orders o
      WHERE o.store_id = ?
      AND DATE(o.created_at) = ?
      AND o.status = 'COMPLETED'
      GROUP BY DATE(o.created_at)
    `, {
      replacements: [storeId, date || new Date().toISOString().split('T')[0]],
      type: sequelize.QueryTypes.SELECT,
    });

    sendSuccess(res, revenueData[0] || {});
  } catch (error) {
    next(error);
  }
};

// Get driver stats for today
const getDriverStats = async (req, res, next) => {
  try {
    const driverId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const statsData = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT o.id) as totalOrders,
        SUM(CASE WHEN o.status = 'COMPLETED' THEN 1 ELSE 0 END) as completedOrders,
        COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.shipping_fee ELSE 0 END), 0) as earnings
      FROM orders o
      WHERE o.driver_id = :driverId
      AND DATE(o.created_at) = :date
    `, {
      replacements: { driverId, date: today },
      type: sequelize.QueryTypes.SELECT,
    });

    const result = statsData[0] || { totalOrders: 0, completedOrders: 0, earnings: 0 };
    console.log('[getDriverStats] Driver:', driverId, 'Date:', today, 'Result:', result);

    // Ensure proper types
    sendSuccess(res, {
      totalOrders: parseInt(result.totalOrders) || 0,
      completedOrders: parseInt(result.completedOrders) || 0,
      earnings: parseFloat(result.earnings) || 0,
    });
  } catch (error) {
    console.error('[getDriverStats] Error:', error);
    next(error);
  }
};

module.exports = {
  checkout,
  getOrder,
  getUserOrders,
  getStoreOrders,
  updateStatus,
  acceptOrder,
  getAvailableOrders,
  getDriverOrders,
  getDailyRevenue,
  getDriverStats,
};
