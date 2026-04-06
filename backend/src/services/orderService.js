const { Order, OrderItem, Food, Store } = require('../models');
const { calculateDistance, calculateShippingFee } = require('../utils/geoUtils');
const { findNearbyStores, findAvailableDrivers } = require('./locationService');

// Create order from cart
const createOrder = async (userId, storeId, items, deliveryLat, deliveryLng, deliveryAddress, notes, paymentMethod) => {
  try {
    const store = await Store.findByPk(storeId);
    if (!store) throw new Error('Store not found');

    // Calculate distance and shipping fee
    const distanceKm = calculateDistance(
      parseFloat(store.lat),
      parseFloat(store.lng),
      parseFloat(deliveryLat),
      parseFloat(deliveryLng)
    );

    const shippingFee = calculateShippingFee(distanceKm);

    // Calculate total food price
    let totalFoodPrice = 0;
    for (const item of items) {
      const food = await Food.findByPk(item.food_id);
      if (!food) throw new Error(`Food with id ${item.food_id} not found`);
      totalFoodPrice += parseFloat(food.price) * item.quantity;
    }

    const totalPrice = totalFoodPrice + shippingFee;

    // Create order
    const order = await Order.create({
      user_id: userId,
      store_id: storeId,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
      delivery_address: deliveryAddress,
      total_food_price: totalFoodPrice,
      shipping_fee: shippingFee,
      total_price: totalPrice,
      distance_km: distanceKm,
      notes,
      payment_method: paymentMethod,
      status: 'PENDING',
    });

    // Create order items
    for (const item of items) {
      const food = await Food.findByPk(item.food_id);
      await OrderItem.create({
        order_id: order.id,
        food_id: item.food_id,
        quantity: item.quantity,
        price: food.price,
        notes: item.notes || null,
      });
    }

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get order details
const getOrderDetails = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          association: 'user',
          attributes: ['id', 'username', 'phone', 'lat', 'lng'],
        },
        {
          association: 'driver',
          attributes: ['id', 'username', 'phone', 'lat', 'lng', 'is_online'],
        },
        {
          association: 'store',
          attributes: ['id', 'name', 'lat', 'lng', 'phone', 'address'],
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
    });

    return order;
  } catch (error) {
    console.error('Error getting order details:', error);
    throw error;
  }
};

// Update order status
const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');

    order.status = newStatus;
    if (newStatus === 'COMPLETED') {
      order.completed_at = new Date();
    }

    await order.save();
    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Assign driver to order
const assignDriverToOrder = async (orderId, driverId) => {
  try {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Order not found');

    order.driver_id = driverId;
    order.status = 'DRIVER_ACCEPTED';
    await order.save();

    return order;
  } catch (error) {
    console.error('Error assigning driver:', error);
    throw error;
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
  updateOrderStatus,
  assignDriverToOrder,
};
