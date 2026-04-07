/**
 * AvailableOrdersScreen
 * ─────────────────────
 * • Tự động lấy vị trí GPS của driver
 * • Hiển thị bản đồ OSM (react-native-maps + UrlTile) với marker các cửa hàng
 *   có đơn hàng đang cần giao trong vòng 10 km
 * • Danh sách đơn hàng sắp xếp theo khoảng cách tới cửa hàng
 * • Realtime: nhận socket NEW_ORDER_AVAILABLE để refresh
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import OsmMap from '../components/OsmMap';
import { useAuthStore, useDriverStore } from '../store/useStore';
import apiClient from '../services/apiClient';
import socketService from '../services/socketService';

const SEARCH_RADIUS_KM = 30;

const AvailableOrdersScreen = ({ navigation }) => {
  const { token, user } = useAuthStore();
  const { setCurrentOrder, currentLocation, setCurrentLocation, isOnline, setIsOnline } =
    useDriverStore();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  // ─── Get driver GPS ─────────────────────────────────────────────────────────
  const startLocationWatch = useCallback(async () => {
    const startWatch = () => {
      watchIdRef.current = Geolocation.watchPosition(
        ({ coords }) => {
          const loc = { latitude: coords.latitude, longitude: coords.longitude };
          setCurrentLocation(loc);
        },
        (err) => console.warn('GPS error', err.message),
        { enableHighAccuracy: true, distanceFilter: 50, interval: 10000 }
      );
    };

    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization('whenInUse').then(startWatch);
    } else {
      // Android: xin quyền runtime
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'SmartFood Driver cần quyền GPS',
            message: 'Ứng dụng cần truy cập vị trí để tìm đơn hàng gần bạn.',
            buttonPositive: 'Cho phép',
            buttonNegative: 'Từ chối',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          startWatch();
        } else {
          Alert.alert('Cần quyền GPS', 'Vui lòng cấp quyền vị trí để sử dụng ứng dụng.');
        }
      } catch (err) {
        console.warn('Permission error', err);
      }
    }
  }, []);

  // ─── Fetch nearby available orders ──────────────────────────────────────────
  const fetchAvailableOrders = useCallback(
    async (loc) => {
      try {
        setLoading(true);
        const position = loc || currentLocation;
        const res = await apiClient.getAvailableOrders(
          token,
          position?.latitude,
          position?.longitude,
          SEARCH_RADIUS_KM
        );
        if (res.success) {
          setOrders(res.data);
        } else {
          console.warn('getAvailableOrders error:', res.message);
        }
      } catch (e) {
        Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
        console.error(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, currentLocation]
  );

  // ─── Accept order ────────────────────────────────────────────────────────────
  const handleAcceptOrder = async (order) => {
    try {
      const res = await apiClient.acceptOrder(token, order.id);
      if (res.success) {
        setCurrentOrder({ ...order, status: 'DRIVER_ACCEPTED' });
        fetchAvailableOrders();
        navigation.navigate('ActiveDeliveries');
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể nhận đơn hàng');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể nhận đơn hàng');
    }
  };

  // ─── Toggle online status ───────────────────────────────────────────────────
  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const res = await apiClient.toggleDriverStatus(token);
      if (res.success) {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        if (newStatus) {
          socketService.driverOnline(user?.id);
        } else {
          socketService.driverOffline(user?.id);
        }
      }
    } finally {
      setTogglingOnline(false);
    }
  };

  // ─── Fit map to show all store markers ──────────────────────────────────────
  const fitMapToOrders = (orderList, driverLoc) => {
    if (!mapRef.current) return;
    const coords = [];
    if (driverLoc) coords.push(driverLoc);
    orderList.forEach((o) => {
      if (o.store?.lat && o.store?.lng) {
        coords.push({
          latitude: parseFloat(o.store.lat),
          longitude: parseFloat(o.store.lng),
        });
      }
    });
    if (coords.length > 0) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  };

  // ─── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    startLocationWatch();
    socketService.connect(token);
    if (user?.id) socketService.driverOnline(user.id);

    socketService.onNewOrderAvailable((data) => {
      fetchAvailableOrders();
      Alert.alert(
        '🔔 Đơn hàng mới!',
        `Đơn #${data.orderId} – ${data.orderDetails?.distance_km?.toFixed(1) ?? '?'} km`,
        [{ text: 'Xem' }]
      );
    });

    return () => {
      if (watchIdRef.current != null) Geolocation.clearWatch(watchIdRef.current);
      socketService.off('NEW_ORDER_AVAILABLE');
    };
  }, []);

  // Fetch orders once we have GPS
  useEffect(() => {
    if (currentLocation) {
      fetchAvailableOrders(currentLocation);
    }
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  // Fit map when orders list changes
  useEffect(() => {
    if (orders.length > 0) fitMapToOrders(orders, currentLocation);
  }, [orders]);

  // ─── Render order card ───────────────────────────────────────────────────────
  const renderOrderCard = ({ item: order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>📦 Đơn #{order.id}</Text>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {order.distance_to_store != null
              ? `📍 ${order.distance_to_store} km`
              : `📏 ${Number(order.distance_km ?? 0).toFixed(1)} km`}
          </Text>
        </View>
      </View>

      {/* Store info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>🏪 Cửa hàng:</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {order.store?.name || '—'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>📍 Địa chỉ CH:</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {order.store?.address || '—'}
        </Text>
      </View>

      {/* Delivery info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>🚚 Giao đến:</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {order.delivery_address}
        </Text>
      </View>

      {/* Money */}
      <View style={styles.moneyRow}>
        <Text style={styles.moneyItem}>
          💰 {Number(order.total_price).toLocaleString('vi-VN')} đ
        </Text>
        <Text style={styles.moneyItem}>
          🛵 +{Number(order.shipping_fee).toLocaleString('vi-VN')} đ
        </Text>
      </View>

      {/* Items preview */}
      {order.items?.length > 0 && (
        <View style={styles.itemsBlock}>
          {order.items.slice(0, 2).map((it, idx) => (
            <Text key={idx} style={styles.itemText}>
              • {it.food?.name} × {it.quantity}
            </Text>
          ))}
          {order.items.length > 2 && (
            <Text style={styles.moreItems}>+{order.items.length - 2} món khác</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.acceptBtn}
        onPress={() => handleAcceptOrder(order)}
      >
        <Text style={styles.acceptBtnText}>✅ Nhận đơn</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  const mapRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }
    : { latitude: 10.8231, longitude: 106.6297, latitudeDelta: 0.15, longitudeDelta: 0.15 };

  return (
    <View style={styles.container}>
      {/* ── Online status bar ── */}
      <View style={[styles.statusBar, isOnline ? styles.statusOnline : styles.statusOffline]}>
        <Text style={styles.statusText}>
          {isOnline ? '🟢 Đang hoạt động' : '🔴 Ngoại tuyến'}
        </Text>
        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={handleToggleOnline}
          disabled={togglingOnline}
        >
          {togglingOnline ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.toggleBtnText}>
              {isOnline ? 'Tắt' : 'Bật'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── OSM mini map showing stores ── */}
      <OsmMap
        style={styles.map}
        region={mapRegion}
        markers={[
          ...(currentLocation
            ? [{ id: 'driver', coordinate: currentLocation, title: 'Tôi 🛵', color: '#2196F3' }]
            : []),
          ...orders
            .filter((o) => o.store?.lat && o.store?.lng)
            .map((o) => ({
              id: String(o.id),
              coordinate: {
                latitude: parseFloat(o.store.lat),
                longitude: parseFloat(o.store.lng),
              },
              title: `🏪 ${o.store.name} – ${o.distance_to_store ?? '?'}km`,
              color: '#E53935',
            })),
        ]}
      />

      {/* ── Header ── */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          🛍️ Đơn trong {SEARCH_RADIUS_KM}km {orders.length > 0 ? `(${orders.length})` : ''}
        </Text>
        {!currentLocation && (
          <Text style={styles.gpsWaiting}>⏳ Đang lấy vị trí GPS…</Text>
        )}
      </View>

      {/* ── Order list ── */}
      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderCard}
          contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAvailableOrders();
              }}
              colors={['#0066cc']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                {currentLocation
                  ? `Không có đơn hàng nào trong ${SEARCH_RADIUS_KM}km`
                  : 'Đang tìm kiếm đơn hàng gần bạn…'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusOnline: { backgroundColor: '#e8f5e9' },
  statusOffline: { backgroundColor: '#fce4ec' },
  statusText: { fontSize: 14, fontWeight: '600', color: '#333' },
  toggleBtn: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Map
  map: { height: 220, width: '100%' },

  // Driver marker
  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  // Store marker
  storeMarker: {
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 3,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ff9500',
    minWidth: 44,
  },
  markerLabel: { fontSize: 9, color: '#ff9500', fontWeight: 'bold' },

  // List header
  listHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  gpsWaiting: { fontSize: 12, color: '#ff9500' },

  // Order card
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderId: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  distanceBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  distanceText: { fontSize: 12, color: '#0066cc', fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'flex-start',
  },
  infoLabel: { fontSize: 12, color: '#888', width: 90 },
  infoValue: { fontSize: 12, color: '#333', flex: 1 },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  moneyItem: { fontSize: 13, fontWeight: '600', color: '#222' },
  itemsBlock: { marginTop: 6 },
  itemText: { fontSize: 12, color: '#555' },
  moreItems: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  acceptBtn: {
    marginTop: 12,
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#999', textAlign: 'center' },
});

export default AvailableOrdersScreen;
