import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        auth: token ? { token } : undefined,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.log('⚠️ Socket connection error:', err.message);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ─── Driver presence ───────────────────────────────────────────────────────
  driverOnline(driverId) {
    this.socket?.emit('DRIVER_ONLINE', { driverId });
  }

  driverOffline(driverId) {
    this.socket?.emit('DRIVER_OFFLINE', { driverId });
  }

  // ─── Order room management ─────────────────────────────────────────────────
  joinOrder(orderId, userId) {
    this.socket?.emit('JOIN_ORDER', { orderId, userId });
  }

  leaveOrder(orderId) {
    this.socket?.emit('LEAVE_ORDER', { orderId });
  }

  // ─── Real-time driver location ─────────────────────────────────────────────
  updateDriverLocation(orderId, lat, lng, driverId) {
    this.socket?.emit('DRIVER_LOCATION_UPDATE', { orderId, lat, lng, driverId });
  }

  // ─── Update order status via socket (broadcast to order room) ─────────────
  emitOrderStatusUpdate(orderId, status) {
    this.socket?.emit('UPDATE_ORDER_STATUS', { orderId, status });
  }

  // ─── Listeners ────────────────────────────────────────────────────────────
  onNewOrderAvailable(callback) {
    this.socket?.on('NEW_ORDER_AVAILABLE', callback);
  }

  onOrderStatusChanged(callback) {
    this.socket?.on('ORDER_STATUS_CHANGED', callback);
  }

  /** Real-time driver location updates coming from server (for customer view) */
  onDriverLocation(callback) {
    this.socket?.on('DRIVER_LOCATION', callback);
  }

  /** Fired once when driver first accepts the order */
  onDriverAccepted(callback) {
    this.socket?.on('DRIVER_ACCEPTED', callback);
  }

  /** Fired when order is fully completed */
  onOrderCompleted(callback) {
    this.socket?.on('ORDER_COMPLETED', callback);
  }

  off(event) {
    this.socket?.off(event);
  }
}

export default new SocketService();

