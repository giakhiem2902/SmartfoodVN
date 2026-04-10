import io from 'socket.io-client';
import { Platform } from 'react-native';

// Resolve a sensible default SOCKET_URL depending on environment/device.
// - On Android emulator use 10.0.2.2 to reach host localhost
// - On iOS simulator localhost works
// - Allow overriding with global.__SOCKET_URL__ or process.env.SOCKET_URL if provided
const resolveSocketUrl = () => {
  // Priority 1: Manual override
  if (global?.__SOCKET_URL__) {
    console.log('[SocketService] Using global.__SOCKET_URL__:', global.__SOCKET_URL__);
    return global.__SOCKET_URL__;
  }
  
  if (typeof process !== 'undefined' && process.env && process.env.SOCKET_URL) {
    console.log('[SocketService] Using process.env.SOCKET_URL:', process.env.SOCKET_URL);
    return process.env.SOCKET_URL;
  }

  // Priority 2: Platform-specific defaults
  if (Platform.OS === 'android') {
    // Use dev machine IP (172.20.10.4) instead of 10.0.2.2
    // This is the actual IP address of the Windows development machine
    console.log('[SocketService] Android detected, using 172.20.10.4:5001 (dev machine IP)');
    return 'http://172.20.10.4:5001';
  }

  console.log('[SocketService] iOS/default, using localhost:5001');
  return 'http://localhost:5001';
};

const SOCKET_URL = resolveSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.failedConnections = [];
  }

  connect(token) {
    if (!this.socket) {
      console.log('[SocketService.connect] Attempting to connect to:', SOCKET_URL);
      
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        auth: token ? { token } : undefined,
        transports: ['polling', 'websocket'],  // Try polling first (more reliable on Android emulator)
        secure: false,
        rejectUnauthorized: false,
        timeout: 30000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        this.isConnected = true;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (err) => {
        console.log('⚠️ Socket connection error:', {
          message: err.message,
          code: err.code,
          type: err.type,
          data: err.data,
          stack: err.stack,
          socketUrl: SOCKET_URL,
        });
        this.failedConnections.push({
          timestamp: new Date(),
          error: err.message,
          url: SOCKET_URL,
        });
      });

      this.socket.on('error', (err) => {
        console.log('❌ Socket error:', {
          message: err?.message || err,
          socketUrl: SOCKET_URL,
        });
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

  // ─── Diagnostics ──────────────────────────────────────────────────────────
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketUrl: SOCKET_URL,
      socketId: this.socket?.id || null,
      failedConnections: this.failedConnections,
      serverReachable: this.socket?.connected || false,
    };
  }

  testConnection() {
    console.log('🔍 [SocketService] Testing connection...');
    console.log('   Target URL:', SOCKET_URL);
    console.log('   Socket exists:', !!this.socket);
    console.log('   Socket connected:', this.socket?.connected);
    console.log('   Socket ID:', this.socket?.id || 'not connected');
    return this.getConnectionStatus();
  }
}

export default new SocketService();

