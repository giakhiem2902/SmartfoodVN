import create from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
  // 2FA: lưu tạm userId khi login cần xác thực OTP
  pendingUserId: null,
  requires2FA: false,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  // Gọi khi login trả về requires_2fa = true
  setPending2FA: (userId) => set({ pendingUserId: userId, requires2FA: true }),
  // Gọi sau khi 2FA xác thực thành công
  clearPending2FA: () => set({ pendingUserId: null, requires2FA: false }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, pendingUserId: null, requires2FA: false });
  },
}));

export const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,
  cart: [],

  setOrders: (orders) => set({ orders }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setCart: (cart) => set({ cart }),
  addToCart: (item) =>
    set((state) => ({
      cart: [...state.cart, item],
    })),
  removeFromCart: (foodId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.foodId !== foodId),
    })),
  clearCart: () => set({ cart: [] }),
}));

export const useLocationStore = create((set) => ({
  userLocation: null,
  driverLocation: null,
  nearbyStores: [],

  setUserLocation: (location) => set({ userLocation: location }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  setNearbyStores: (stores) => set({ nearbyStores: stores }),
}));
