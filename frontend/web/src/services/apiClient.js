const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper: lấy token từ localStorage
const getToken = () => localStorage.getItem('token');

// Helper: gọi API với JSON body
const request = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token || getToken()) {
    headers['Authorization'] = `Bearer ${token || getToken()}`;
  }
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const json = await response.json();

  // Ném lỗi nếu status không phải 2xx
  if (!response.ok) {
    const err = new Error(json.message || json.error || 'API Error');
    err.response = { data: json, status: response.status };
    throw err;
  }

  // Tự động unwrap nếu backend dùng sendSuccess wrapper { success, message, data }
  // Nếu không có wrapper thì trả về nguyên json (vd: /google/verify)
  return json.data !== undefined ? json.data : json;
};

const apiClient = {
  // ==================== AUTH ====================
  async register(data) {
    return request('POST', '/auth/register', data);
  },

  async login(email, password) {
    return request('POST', '/auth/login', { email, password });
  },

  async getCurrentUser() {
    return request('GET', '/auth/me');
  },

  async updateProfile(data) {
    return request('PUT', '/auth/profile', data);
  },

  async updateLocation(lat, lng) {
    return request('PUT', '/auth/location', { lat, lng });
  },

  // ==================== GOOGLE OAUTH ====================
  // Xác thực Google access token (dùng cho Web với @react-oauth/google)
  async googleVerify(accessToken) {
    return request('POST', '/google/verify', { accessToken });
  },

  // ==================== 2FA ====================
  // Lấy QR code để setup 2FA
  async twoFAGenerate() {
    return request('POST', '/google/2fa/generate');
  },

  // Xác nhận bật 2FA (sau khi scan QR)
  async twoFAConfirm(secret, token) {
    return request('POST', '/google/2fa/confirm', { secret, token });
  },

  // Verify OTP khi đăng nhập có 2FA
  async twoFAVerify(token) {
    return request('POST', '/google/2fa/verify', { token });
  },

  // Tắt 2FA (cần OTP để xác nhận)
  async twoFADisable(token) {
    return request('POST', '/google/2fa/disable', { token });
  },

  // Lấy backup codes
  async twoFAGetBackupCodes() {
    return request('POST', '/google/2fa/backup-codes');
  },

  // Đăng nhập bằng backup code
  async twoFAVerifyBackupCode(userId, backupCode) {
    return request('POST', '/google/2fa/backup-codes/verify', { userId, backupCode });
  },

  // Kiểm tra trạng thái 2FA
  async twoFAStatus() {
    return request('GET', '/google/2fa/status');
  },

  // ==================== STORES ====================
  async getNearbyStores(lat, lng, radius = 20) {
    const response = await fetch(
      `${API_BASE_URL}/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    return response.json();
  },

  async getStoreDetails(storeId) {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}`);
    return response.json();
  },

  async getStore(storeId) {
    return request('GET', `/stores/${storeId}`);
  },

  async getStoreFoods(storeId) {
    return request('GET', `/stores/${storeId}/foods`);
  },

  async getStoreCategories(storeId) {
    return request('GET', `/stores/${storeId}/categories`);
  },

  // ==================== ORDERS ====================
  async createOrder(orderData) {
    return request('POST', '/orders', orderData);
  },

  async checkout(orderData) {
    return request('POST', '/orders/checkout', orderData);
  },

  async getOrder(orderId) {
    return request('GET', `/orders/${orderId}`);
  },

  async getUserOrders() {
    return request('GET', '/orders/my-orders');
  },

  // ==================== GENERIC (dùng trong SecuritySettingsPage) ====================
  async get(path) {
    return request('GET', path);
  },

  async post(path, body) {
    return request('POST', path, body);
  },
};

export default apiClient;
