const { Order, User, DriverLocationHistory } = require('../models');
const { updateOrderStatus } = require('../services/orderService');
const { findAvailableDrivers } = require('../services/locationService');

// Socket.io event handlers
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // ========== Order Room Management ==========
    socket.on('JOIN_ORDER', async (data) => {
      const { orderId, userId } = data;
      const roomName = `order_${orderId}`;
      
      socket.join(roomName);
      console.log(`User ${userId} joined room ${roomName}`);

      // Fetch and send current order status
      try {
        const order = await Order.findByPk(orderId);
        if (order) {
          socket.emit('ORDER_STATUS', {
            orderId,
            status: order.status,
            driverId: order.driver_id,
          });
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    });

    socket.on('LEAVE_ORDER', (data) => {
      const { orderId } = data;
      const roomName = `order_${orderId}`;
      socket.leave(roomName);
      console.log(`User left room ${roomName}`);
    });

    // ========== Order Status Updates ==========
    socket.on('UPDATE_ORDER_STATUS', async (data) => {
      const { orderId, status } = data;
      const roomName = `order_${orderId}`;

      try {
        // Update in database
        const updatedOrder = await updateOrderStatus(orderId, status);

        // Broadcast to all users in room
        io.to(roomName).emit('ORDER_STATUS_CHANGED', {
          orderId,
          status,
          updatedAt: updatedOrder.updated_at,
        });

        // Special handling for status transitions
        if (status === 'CONFIRMED') {
          // Store confirmed, start finding driver
          io.to(roomName).emit('STORE_CONFIRMED', { orderId });
        }

        if (status === 'FINDING_DRIVER') {
          // Notify available drivers
          const order = await Order.findByPk(orderId);
          const drivers = await findAvailableDrivers(order.store.lat, order.store.lng, 10);

          drivers.forEach(driver => {
            io.to(`driver_${driver.id}`).emit('NEW_ORDER_AVAILABLE', {
              orderId,
              orderDetails: {
                storeAddress: order.delivery_address,
                distance_km: order.distance_km,
                total_price: order.total_price,
              },
            });
          });
        }

        if (status === 'DRIVER_ACCEPTED') {
          io.to(roomName).emit('DRIVER_ACCEPTED', {
            orderId,
            message: 'Driver is on the way',
          });
        }

        if (status === 'COMPLETING') {
          io.to(roomName).emit('ORDER_COMPLETING', { orderId });
        }

        if (status === 'COMPLETED') {
          io.to(roomName).emit('ORDER_COMPLETED', {
            orderId,
            completedAt: updatedOrder.completed_at,
          });
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        socket.emit('ERROR', { message: 'Failed to update order status' });
      }
    });

    // ========== Driver Location Tracking ==========
    socket.on('DRIVER_LOCATION_UPDATE', async (data) => {
      const { orderId, lat, lng, driverId } = data;
      const roomName = `order_${orderId}`;

      try {
        // Save location history
        await DriverLocationHistory.create({
          driver_id: driverId,
          order_id: orderId,
          lat,
          lng,
        });

        // Update user location in database
        await User.update(
          { lat, lng },
          { where: { id: driverId } }
        );

        // Broadcast to all users in room
        io.to(roomName).emit('DRIVER_LOCATION', {
          orderId,
          lat,
          lng,
          driverId,
        });
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    });

    // ========== Driver Status ==========
    socket.on('DRIVER_ONLINE', async (data) => {
      const { driverId } = data;
      try {
        await User.update(
          { is_online: true },
          { where: { id: driverId } }
        );

        socket.join(`driver_${driverId}`);
        io.emit('DRIVER_STATUS_CHANGED', {
          driverId,
          is_online: true,
        });
      } catch (error) {
        console.error('Error updating driver status:', error);
      }
    });

    socket.on('DRIVER_OFFLINE', async (data) => {
      const { driverId } = data;
      try {
        await User.update(
          { is_online: false },
          { where: { id: driverId } }
        );

        socket.leave(`driver_${driverId}`);
        io.emit('DRIVER_STATUS_CHANGED', {
          driverId,
          is_online: false,
        });
      } catch (error) {
        console.error('Error updating driver status:', error);
      }
    });

    // ========== Admin Dashboard ==========
    socket.on('ADMIN_JOIN', (data) => {
      const { adminId } = data;
      socket.join('admin_dashboard');
      console.log(`Admin ${adminId} joined dashboard`);
    });

    socket.on('ADMIN_LEAVE', () => {
      socket.leave('admin_dashboard');
    });

    // ========== Notifications ==========
    socket.on('NOTIFY_ADMIN', async (data) => {
      const { orderId, message } = data;
      io.to('admin_dashboard').emit('ADMIN_NOTIFICATION', {
        orderId,
        message,
        timestamp: new Date(),
      });
    });

    // ========== Disconnect ==========
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });
};

module.exports = setupSocketHandlers;
