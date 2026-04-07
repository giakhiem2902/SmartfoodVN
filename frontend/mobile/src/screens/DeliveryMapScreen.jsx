/**
 * DeliveryMapScreen
 * ─────────────────
 * • OpenStreetMap tiles (react-native-maps URLTile – no Google Maps API key needed)
 * • OSRM routing: driver ──► store ──► customer
 * • Real-time driver location broadcast via socket
 * • Status flow: DRIVER_ACCEPTED → PICKING_UP → DELIVERING → COMPLETED
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { useAuthStore, useDriverStore } from '../store/useStore';
import socketService from '../services/socketService';
import apiClient, { fetchOSRMRoute } from '../services/apiClient';
import OsmMap from '../components/OsmMap';

// ─── Status configuration ─────────────────────────────────────────────────────
const STATUS_FLOW = [
  {
    key: 'DRIVER_ACCEPTED',
    label: 'Đã nhận đơn',
    icon: '✅',
    color: '#0066cc',
    next: 'PICKING_UP',
    nextLabel: '📍 Bắt đầu lấy hàng',
  },
  {
    key: 'PICKING_UP',
    label: 'Đang lấy hàng',
    icon: '🏪',
    color: '#ff9500',
    next: 'DELIVERING',
    nextLabel: '🛵 Bắt đầu giao hàng',
  },
  {
    key: 'DELIVERING',
    label: 'Đang giao hàng',
    icon: '🛵',
    color: '#9b59b6',
    next: 'COMPLETED',
    nextLabel: '✅ Hoàn thành giao hàng',
  },
  {
    key: 'COMPLETED',
    label: 'Đã hoàn thành',
    icon: '🎉',
    color: '#00cc66',
    next: null,
    nextLabel: null,
  },
];

const getStatusConfig = (status) =>
  STATUS_FLOW.find((s) => s.key === status) || STATUS_FLOW[0];

const DeliveryMapScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { token, user } = useAuthStore();
  const { setDeliveryPhase } = useDriverStore();

  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeSegments, setRouteSegments] = useState({ toStore: [], toUser: [] });
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  // ─── Fetch order ────────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    try {
      const res = await apiClient.getOrder(token, orderId);
      if (res.success) {
        setOrder(res.data);
        setDeliveryPhase(res.data.status);
      }
    } catch (e) {
      console.error('fetchOrder error', e);
    }
  }, [orderId, token]);

  // ─── Build OSRM route: driver → store → user ────────────────────────────────
  const buildRoute = useCallback(async (driverCoord, orderData) => {
    if (!orderData?.store || !driverCoord) return;
    setLoadingRoute(true);
    try {
      const store = {
        latitude: parseFloat(orderData.store.lat),
        longitude: parseFloat(orderData.store.lng),
      };
      const dest = {
        latitude: parseFloat(orderData.delivery_lat),
        longitude: parseFloat(orderData.delivery_lng),
      };
      const [toStore, toUser] = await Promise.all([
        fetchOSRMRoute([driverCoord, store]),
        fetchOSRMRoute([store, dest]),
      ]);
      setRouteSegments({ toStore: toStore || [], toUser: toUser || [] });
    } finally {
      setLoadingRoute(false);
    }
  }, []);

  // ─── Start GPS tracking ──────────────────────────────────────────────────────
  const startTracking = useCallback(() => {
    watchIdRef.current = Geolocation.watchPosition(
      ({ coords }) => {
        const loc = { latitude: coords.latitude, longitude: coords.longitude };
        setDriverLocation(loc);
        socketService.updateDriverLocation(orderId, coords.latitude, coords.longitude, user?.id);
        mapRef.current?.animateToRegion(
          { ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          500
        );
      },
      (err) => console.warn('GPS error', err.code, err.message),
      { enableHighAccuracy: true, distanceFilter: 10, interval: 4000, fastestInterval: 2000 }
    );
  }, [orderId, user?.id]);

  // ─── Setup on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrder();
    socketService.connect(token);
    socketService.joinOrder(orderId, user?.id);

    socketService.onOrderStatusChanged(({ orderId: oid, status }) => {
      if (String(oid) === String(orderId)) {
        setOrder((prev) => (prev ? { ...prev, status } : prev));
        setDeliveryPhase(status);
        if (status === 'COMPLETED') {
          Alert.alert('🎉 Hoàn thành!', 'Đơn hàng đã được giao thành công.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      }
    });

    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization('whenInUse').then(() => startTracking());
    } else {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'SmartFood Driver cần quyền GPS',
          message: 'Ứng dụng cần vị trí để theo dõi lộ trình giao hàng.',
          buttonPositive: 'Cho phép',
          buttonNegative: 'Từ chối',
        }
      ).then((granted) => {
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          startTracking();
        } else {
          Alert.alert('Cần quyền GPS', 'Vui lòng cấp quyền vị trí để giao hàng.');
        }
      });
    }

    return () => {
      if (watchIdRef.current != null) Geolocation.clearWatch(watchIdRef.current);
      socketService.leaveOrder(orderId);
      socketService.off('ORDER_STATUS_CHANGED');
    };
  }, []);

  // Rebuild route when order data arrives
  useEffect(() => {
    if (driverLocation && order) buildRoute(driverLocation, order);
  }, [order]);

  // ─── Fit map to all waypoints ────────────────────────────────────────────────
  const fitToRoute = () => {
    const all = [...routeSegments.toStore, ...routeSegments.toUser];
    if (!mapRef.current || all.length === 0) return;
    mapRef.current.fitToCoordinates(all, {
      edgePadding: { top: 60, right: 40, bottom: 220, left: 40 },
      animated: true,
    });
  };

  // ─── Advance status ─────────────────────────────────────────────────────────
  const handleAdvanceStatus = async () => {
    const cfg = getStatusConfig(order?.status);
    if (!cfg?.next) return;

    const msgs = {
      PICKING_UP: 'Xác nhận bắt đầu lấy hàng tại cửa hàng?',
      DELIVERING: 'Xác nhận đã lấy hàng và bắt đầu giao?',
      COMPLETED: 'Xác nhận đã giao hàng thành công cho khách?',
    };

    Alert.alert('Cập nhật trạng thái', msgs[cfg.next] || 'Tiếp tục?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          setUpdatingStatus(true);
          try {
            const res = await apiClient.updateOrderStatus(token, orderId, cfg.next);
            if (res.success) {
              socketService.emitOrderStatusUpdate(orderId, cfg.next);
              setOrder((prev) => ({ ...prev, status: cfg.next }));
              setDeliveryPhase(cfg.next);
              if (cfg.next === 'COMPLETED') {
                Alert.alert('🎉 Hoàn thành!', 'Đơn hàng đã giao thành công!', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              }
            } else {
              Alert.alert('Lỗi', res.message || 'Không thể cập nhật trạng thái');
            }
          } catch {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
          } finally {
            setUpdatingStatus(false);
          }
        },
      },
    ]);
  };

  // ─── Render loading ─────────────────────────────────────────────────────────
  if (!order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 10, color: '#666' }}>Đang tải thông tin đơn hàng…</Text>
      </View>
    );
  }

  const statusCfg = getStatusConfig(order.status);
  const storeLoc = order.store
    ? { latitude: parseFloat(order.store.lat), longitude: parseFloat(order.store.lng) }
    : null;
  const destLoc = {
    latitude: parseFloat(order.delivery_lat),
    longitude: parseFloat(order.delivery_lng),
  };
  const initialRegion = driverLocation
    ? { ...driverLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    : storeLoc
    ? { ...storeLoc, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    : { latitude: 10.8231, longitude: 106.6297, latitudeDelta: 0.04, longitudeDelta: 0.04 };

  return (
    <View style={styles.container}>
      {/* ══════════════ MAP ══════════════ */}
      <OsmMap
        style={styles.map}
        region={initialRegion}
        onReady={fitToRoute}
        markers={[
          ...(driverLocation
            ? [{ id: 'driver', coordinate: driverLocation, title: 'Tôi 🛵', color: '#2196F3' }]
            : []),
          ...(storeLoc
            ? [{ id: 'store', coordinate: storeLoc, title: `🏪 ${order.store?.name ?? 'Cửa hàng'}`, color: '#FF6F00' }]
            : []),
          { id: 'dest', coordinate: destLoc, title: '� Khách hàng', color: '#E53935' },
        ]}
      />

      {/* Fit-to-route button */}
      <TouchableOpacity style={styles.fitButton} onPress={fitToRoute}>
        <Text style={{ fontSize: 18 }}>🗺️</Text>
      </TouchableOpacity>

      {/* Route loading overlay */}
      {loadingRoute && (
        <View style={styles.routeLoader}>
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={styles.routeLoaderText}>Đang tải đường đi…</Text>
        </View>
      )}

      {/* ══════════════ STATUS TIMELINE ══════════════ */}
      <View style={styles.timelineRow}>
        {STATUS_FLOW.map((s, i) => {
          const activeIdx = STATUS_FLOW.findIndex((x) => x.key === order.status);
          const active = s.key === order.status;
          const passed = i < activeIdx;
          return (
            <React.Fragment key={s.key}>
              <View style={styles.timelineStep}>
                <View
                  style={[
                    styles.timelineDot,
                    passed && styles.timelinePassed,
                    active && { backgroundColor: s.color, borderColor: s.color },
                  ]}
                >
                  <Text style={{ fontSize: 10 }}>{passed ? '✓' : s.icon}</Text>
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    active && { color: s.color, fontWeight: 'bold' },
                    passed && { color: '#00cc66' },
                  ]}
                  numberOfLines={2}
                >
                  {s.label}
                </Text>
              </View>
              {i < STATUS_FLOW.length - 1 && (
                <View style={[styles.timelineLine, passed && styles.timelineLinePassed]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ══════════════ INFO CARD ══════════════ */}
      <ScrollView style={styles.infoCard} nestedScrollEnabled>
        {/* Store info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{order.store?.name || 'Cửa hàng'}</Text>
            <Text style={styles.infoSub}>{order.store?.address}</Text>
            {order.store?.phone ? (
              <Text style={styles.infoSub}>📞 {order.store.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* Delivery address */}
        <View style={[styles.infoRow, { marginTop: 8 }]}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Địa chỉ giao hàng</Text>
            <Text style={styles.infoSub}>{order.delivery_address}</Text>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.infoMeta}>
          <Text style={styles.metaItem}>💰 {Number(order.total_price).toLocaleString('vi-VN')} đ</Text>
          <Text style={styles.metaItem}>📏 {Number(order.distance_km).toFixed(1)} km</Text>
          <Text style={styles.metaItem}>🚚 {Number(order.shipping_fee).toLocaleString('vi-VN')} đ</Text>
        </View>

        {/* Action button */}
        {statusCfg.next ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: statusCfg.color },
              updatingStatus && styles.disabledBtn,
            ]}
            onPress={handleAdvanceStatus}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>{statusCfg.nextLabel}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionBtn, { backgroundColor: '#00cc66' }]}>
            <Text style={styles.actionBtnText}>🎉 Đơn hàng đã hoàn thành</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1, minHeight: 300 },

  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  storeMarker: {
    backgroundColor: '#fff8e1',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#ff9500',
  },
  destMarker: {
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#00cc66',
  },

  fitButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  routeLoader: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 3,
  },
  routeLoaderText: { marginLeft: 6, fontSize: 12, color: '#333' },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelinePassed: { backgroundColor: '#e8f5e9', borderColor: '#00cc66' },
  timelineLabel: { fontSize: 9, color: '#999', marginTop: 4, textAlign: 'center' },
  timelineLine: { flex: 0.3, height: 2, backgroundColor: '#ccc', marginTop: 13 },
  timelineLinePassed: { backgroundColor: '#00cc66' },

  // Info card
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    maxHeight: 240,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { fontSize: 18, marginRight: 8, marginTop: 2 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  infoSub: { fontSize: 12, color: '#666', marginTop: 2 },
  infoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaItem: { fontSize: 12, color: '#444' },
  actionBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  disabledBtn: { opacity: 0.6 },
});

export default DeliveryMapScreen;
