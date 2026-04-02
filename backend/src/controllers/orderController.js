const { Order, OrderItem, Food } = require('../models');
const { createOrder, getOrderDetails, updateOrderStatus, assignDriverToOrder } = require('../services/orderService');
const { findAvailableDrivers } = require('../services/locationService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const sequelize = require('../config/database');

// Create order
const checkout = async (req, res, next) => {
  try {
    const { storeId, items, deliveryLat, deliveryLng, deliveryAddress, notes, paymentMethod } = req.body;
    const userId = req.user.id;

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

// Get available orders for driver
const getAvailableOrders = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver') {
      return sendError(res, 'Only drivers can view available orders', 403);
    }

    const orders = await Order.findAll({
      where: { status: 'FINDING_DRIVER' },
      order: [['created_at', 'ASC']],
    });

    sendSuccess(res, orders);
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
      where: { driver_id: req.user.id },
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
