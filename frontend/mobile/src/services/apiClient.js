import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register(data) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateLocation(token, lat, lng) {
    const response = await fetch(`${API_BASE_URL}/auth/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lat, lng }),
    });
    return response.json();
  },

  async toggleDriverStatus(token) {
    const response = await fetch(`${API_BASE_URL}/auth/driver/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getAvailableOrders(token) {
    const response = await fetch(`${API_BASE_URL}/orders/available`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async acceptOrder(token, orderId) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getDriverOrders(token) {
    const response = await fetch(`${API_BASE_URL}/orders/driver/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async getOrder(token, orderId) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async updateOrderStatus(token, orderId, status) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },
};

export default apiClient;
