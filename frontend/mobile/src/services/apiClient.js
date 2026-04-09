import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api';

// ─── OSRM Public API (OpenStreetMap routing) ──────────────────────────────────
// Returns decoded array of { latitude, longitude } for a multi-waypoint route
export const fetchOSRMRoute = async (waypoints) => {
  // waypoints: [{ latitude, longitude }, ...]
  const coords = waypoints.map((p) => `${p.longitude},${p.latitude}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.code === 'Ok' && json.routes.length > 0) {
      // GeoJSON coordinates are [lng, lat]
      return json.routes[0].geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
    }
    return null;
  } catch (e) {
    console.error('OSRM fetch error:', e);
    return null;
  }
};

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

  // Lấy các đơn hàng available, lọc theo vị trí driver (radius km, mặc định 10)
  async getAvailableOrders(token, lat, lng, radiusKm = 10) {
    let url = `${API_BASE_URL}/orders/available`;
    if (lat != null && lng != null) {
      url += `?lat=${lat}&lng=${lng}&radius=${radiusKm}`;
    }
    const response = await fetch(url, {
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

  async getDriverStats(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/driver/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      return { totalOrders: 0, completedOrders: 0, earnings: 0 };
    }
  },
};

export default apiClient;
