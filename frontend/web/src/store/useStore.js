import create from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useOrderStore = create(
  persist(
    (set) => ({
      orders: [],
      currentOrder: null,
      cart: [],

      setOrders: (orders) => set({ orders }),
      setCurrentOrder: (order) => set({ currentOrder: order }),
      setCart: (cart) => set({ cart }),
      
      // Thêm item vào giỏ (hoặc cập nhật số lượng nếu đã có)
      addToCart: (item) =>
        set((state) => {
          const existingItem = state.cart.find(
            (cartItem) => cartItem.id === item.id && cartItem.storeId === item.storeId
          );
          
          if (existingItem) {
            // Nếu item đã có, tăng quantity
            return {
              cart: state.cart.map((cartItem) =>
                cartItem.id === item.id && cartItem.storeId === item.storeId
                  ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
                  : cartItem
              ),
            };
          } else {
            // Nếu item chưa có, thêm mới
            return {
              cart: [...state.cart, { ...item, quantity: item.quantity || 1 }],
            };
          }
        }),

      // Cập nhật số lượng của item
      updateQuantity: (foodId, storeId, quantity) =>
        set((state) => ({
          cart: quantity <= 0
            ? state.cart.filter((item) => !(item.id === foodId && item.storeId === storeId))
            : state.cart.map((item) =>
                item.id === foodId && item.storeId === storeId
                  ? { ...item, quantity }
                  : item
              ),
        })),

      // Xóa item khỏi giỏ
      removeFromCart: (foodId, storeId) =>
        set((state) => ({
          cart: state.cart.filter((item) => !(item.id === foodId && item.storeId === storeId)),
        })),

      // Xóa tất cả
      clearCart: () => set({ cart: [] }),

      // Tính tổng giá
      getTotalPrice: () => {
        const state = useOrderStore.getState();
        return state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      // Tính tổng số lượng items
      getTotalItems: () => {
        const state = useOrderStore.getState();
        return state.cart.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'order-storage', // localStorage key
      partialize: (state) => ({ cart: state.cart }), // Chỉ persist cart, không persist orders
    }
  )
);

export const useLocationStore = create((set) => ({
  userLocation: null,
  userAddress: 'Đang xác định vị trí...',
  driverLocation: null,
  nearbyStores: [],

  setUserLocation: (location) => set({ userLocation: location }),
  setUserAddress: (address) => set({ userAddress: address }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  setNearbyStores: (stores) => set({ nearbyStores: stores }),
}));
