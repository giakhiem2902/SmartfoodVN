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
  StatusBar,
} from 'react-native';

const PRIMARY = '#ff6b35';
const PRIMARY_LIGHT = '#fff3ee';
const PRIMARY_DARK = '#e55a24';
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
  const mapWebViewRef = useRef(null);
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
    // Inject FIT_BOUNDS vào WebView (OsmMap tự tính bounds từ markers + route)
    if (mapWebViewRef.current) {
      mapWebViewRef.current.injectJavaScript(
        `handleMessage(${JSON.stringify(JSON.stringify({ type: 'FIT_BOUNDS' }))});true;`
      );
    }
  };

  // ─── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Delay nhỏ để Activity attach xong trước khi gọi PermissionsAndroid
    const timer = setTimeout(() => startLocationWatch(), 300);
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
      clearTimeout(timer);
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
      {/* Left accent bar */}
      <View style={styles.cardAccent} />

      <View style={styles.cardContent}>
        {/* Header row */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderIdLabel}>ĐƠN HÀNG</Text>
            <Text style={styles.orderId}>#{order.id}</Text>
          </View>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              {order.distance_to_store != null
                ? `${parseFloat(order.distance_to_store).toFixed(1)} km`
                : `${Number(order.distance_km ?? 0).toFixed(1)} km`}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Store info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏪</Text>
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoLabel}>Cửa hàng</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {order.store?.name || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoLabel}>Địa chỉ lấy hàng</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {order.store?.address || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏠</Text>
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoLabel}>Giao đến</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {order.delivery_address}
            </Text>
          </View>
        </View>

        {/* Money row */}
        <View style={styles.moneyRow}>
          <View style={styles.moneyBlock}>
            <Text style={styles.moneyLabel}>Tiền hàng</Text>
            <Text style={styles.moneyValue}>
              {Number(order.total_price).toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <View style={styles.moneyDivider} />
          <View style={styles.moneyBlock}>
            <Text style={styles.moneyLabel}>Phí giao</Text>
            <Text style={[styles.moneyValue, { color: PRIMARY }]}>
              +{Number(order.shipping_fee).toLocaleString('vi-VN')} đ
            </Text>
          </View>
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

        {/* Accept button */}
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAcceptOrder(order)}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptBtnText}>Nhận đơn ngay</Text>
        </TouchableOpacity>
      </View>
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
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Đơn hàng gần bạn</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length > 0
              ? `${orders.length} đơn trong bán kính ${SEARCH_RADIUS_KM}km`
              : `Tìm kiếm trong ${SEARCH_RADIUS_KM}km…`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.onlineToggle, isOnline ? styles.onlineToggleOn : styles.onlineToggleOff]}
          onPress={handleToggleOnline}
          disabled={togglingOnline}
        >
          {togglingOnline ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.onlineToggleText}>{isOnline ? '● Trực tuyến' : '○ Ngoại tuyến'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── GPS notice ── */}
      {!currentLocation && (
        <View style={styles.gpsBar}>
          <ActivityIndicator size="small" color={PRIMARY} />
          <Text style={styles.gpsText}>  Đang lấy vị trí GPS…</Text>
        </View>
      )}

      {/* ── OSM mini map ── */}
      <OsmMap
        style={styles.map}
        region={mapRegion}
        webViewRef={mapWebViewRef}
        markers={[
          ...(currentLocation
            ? [{ id: 'driver', coordinate: currentLocation, title: 'Tôi', type: 'driver', color: '#2196F3' }]
            : []),
          ...orders
            .filter((o) => o.store?.lat && o.store?.lng)
            .map((o) => ({
              id: String(o.id),
              coordinate: {
                latitude: parseFloat(o.store.lat),
                longitude: parseFloat(o.store.lng),
              },
              title: `${o.store.name} – ${o.distance_to_store ?? '?'}km`,
              type: 'store',
              color: '#E53935',
            })),
        ]}
      />

      {/* ── Order list ── */}
      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Đang tải đơn hàng…</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAvailableOrders();
              }}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
              <Text style={styles.emptyText}>
                {currentLocation
                  ? `Không có đơn trong ${SEARCH_RADIUS_KM}km. Kéo xuống để làm mới.`
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
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },

  // ── Header ──
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  onlineToggle: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 110,
    alignItems: 'center',
  },
  onlineToggleOn: { backgroundColor: '#27ae60' },
  onlineToggleOff: { backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  onlineToggleText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── GPS bar ──
  gpsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffd6c2',
  },
  gpsText: { fontSize: 13, color: PRIMARY, fontWeight: '500' },

  // ── Map ──
  map: { height: 220, width: '100%' },

  // ── List ──
  listContent: { padding: 12, paddingBottom: 24 },

  // ── Order card ──
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardAccent: {
    width: 4,
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardContent: { flex: 1, padding: 14 },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdRow: { flexDirection: 'column' },
  orderIdLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  orderId: { fontSize: 18, fontWeight: 'bold', color: '#222' },

  distanceBadge: {
    backgroundColor: PRIMARY_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffd6c2',
  },
  distanceText: { fontSize: 13, color: PRIMARY, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 10 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoIcon: { fontSize: 15, width: 24, marginTop: 1 },
  infoTextBlock: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 13, color: '#333', marginTop: 1 },

  moneyRow: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  moneyBlock: { flex: 1, alignItems: 'center' },
  moneyDivider: { width: 1, height: 30, backgroundColor: '#eee' },
  moneyLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 2 },
  moneyValue: { fontSize: 14, fontWeight: 'bold', color: '#222' },

  itemsBlock: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  itemText: { fontSize: 12, color: '#555', lineHeight: 20 },
  moreItems: { fontSize: 11, color: '#aaa', fontStyle: 'italic', marginTop: 2 },

  acceptBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // ── Empty ──
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#444', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
});

export default AvailableOrdersScreen;
