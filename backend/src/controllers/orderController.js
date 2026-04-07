const { Order, OrderItem, Food } = require('../models');
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

    // Check authorization
    if (req.user.role !== 'admin' && order.user_id !== req.user.id && order.driver_id !== req.user.id) {
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
    const orders = await Order.findAll({
      where: { store_id: storeId },
      include: [
        {
          association: 'items',
          include: [{ model: Food }],
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

    const order = await updateOrderStatus(orderId, status);
    sendSuccess(res, order, 'Order status updated');
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
};
