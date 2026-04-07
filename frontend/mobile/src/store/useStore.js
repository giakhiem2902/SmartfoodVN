import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,

  setUser: async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  setToken: async (token) => {
    await AsyncStorage.setItem('token', token);
    set({ token });
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    set({ user: null, token: null });
  },
  loadToken: async () => {
    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    if (token) {
      const user = userStr ? JSON.parse(userStr) : null;
      set({ token, user });
    }
  },
}));

export const useDriverStore = create((set, get) => ({
  isOnline: false,
  currentLocation: null,   // { latitude, longitude }
  acceptedOrders: [],
  currentOrder: null,

  // Nearby available orders (within 10km)
  nearbyOrders: [],
  nearbyOrdersLoading: false,

  // Active delivery route waypoints fetched from OSRM
  // { driverToStore: [{ latitude, longitude }], storeToUser: [{ latitude, longitude }] }
  activeRoute: null,

  // Real-time delivery status for current order
  // 'PICKING_UP' | 'DELIVERING' | 'COMPLETED'
  deliveryPhase: null,

  setIsOnline: (isOnline) => set({ isOnline }),
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setAcceptedOrders: (orders) => set({ acceptedOrders: orders }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setNearbyOrders: (orders) => set({ nearbyOrders: orders }),
  setNearbyOrdersLoading: (loading) => set({ nearbyOrdersLoading: loading }),
  setActiveRoute: (route) => set({ activeRoute: route }),
  setDeliveryPhase: (phase) => set({ deliveryPhase: phase }),

  updateOrderStatusInList: (orderId, status) =>
    set((state) => ({
      acceptedOrders: state.acceptedOrders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, status }
          : state.currentOrder,
    })),
}));
