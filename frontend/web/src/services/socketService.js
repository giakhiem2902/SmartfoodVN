import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

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

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Order room management
  joinOrder(orderId, userId) {
    if (this.socket) {
      this.socket.emit('JOIN_ORDER', { orderId, userId });
    }
  }

  leaveOrder(orderId) {
    if (this.socket) {
      this.socket.emit('LEAVE_ORDER', { orderId });
    }
  }

  // Order tracking
  onOrderStatus(callback) {
    if (this.socket) {
      this.socket.on('ORDER_STATUS', callback);
    }
  }

  onOrderStatusChanged(callback) {
    if (this.socket) {
      this.socket.on('ORDER_STATUS_CHANGED', callback);
    }
  }

  onDriverLocation(callback) {
    if (this.socket) {
      this.socket.on('DRIVER_LOCATION', callback);
    }
  }

  onNewOrderAvailable(callback) {
    if (this.socket) {
      this.socket.on('NEW_ORDER_AVAILABLE', callback);
    }
  }

  // Driver status
  setDriverOnline(driverId) {
    if (this.socket) {
      this.socket.emit('DRIVER_ONLINE', { driverId });
    }
  }

  setDriverOffline(driverId) {
    if (this.socket) {
      this.socket.emit('DRIVER_OFFLINE', { driverId });
    }
  }

  // Send driver location
  updateDriverLocation(orderId, lat, lng, driverId) {
    if (this.socket) {
      this.socket.emit('DRIVER_LOCATION_UPDATE', { orderId, lat, lng, driverId });
    }
  }

  // Remove specific listener
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();
