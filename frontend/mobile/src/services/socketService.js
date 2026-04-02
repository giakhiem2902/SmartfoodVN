import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Driver events
  driverOnline(driverId) {
    if (this.socket) {
      this.socket.emit('DRIVER_ONLINE', { driverId });
    }
  }

  driverOffline(driverId) {
    if (this.socket) {
      this.socket.emit('DRIVER_OFFLINE', { driverId });
    }
  }

  // Receive new orders
  onNewOrderAvailable(callback) {
    if (this.socket) {
      this.socket.on('NEW_ORDER_AVAILABLE', callback);
    }
  }

  // Send location updates
  updateDriverLocation(orderId, lat, lng, driverId) {
    if (this.socket) {
      this.socket.emit('DRIVER_LOCATION_UPDATE', { orderId, lat, lng, driverId });
    }
  }

  // Join order room
  joinOrder(orderId, driverId) {
    if (this.socket) {
      this.socket.emit('JOIN_ORDER', { orderId, userId: driverId });
    }
  }

  // Listen for order status changes
  onOrderStatusChanged(callback) {
    if (this.socket) {
      this.socket.on('ORDER_STATUS_CHANGED', callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();
