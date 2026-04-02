import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,

  setUser: (user) => set({ user }),
  setToken: async (token) => {
    await AsyncStorage.setItem('token', token);
    set({ token });
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null });
  },
  loadToken: async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      set({ token });
    }
  },
}));

export const useDriverStore = create((set) => ({
  isOnline: false,
  currentLocation: null,
  acceptedOrders: [],
  currentOrder: null,

  setIsOnline: (isOnline) => set({ isOnline }),
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setAcceptedOrders: (orders) => set({ acceptedOrders: orders }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
}));
