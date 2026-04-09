/**
 * DeliveryMapScreen
 * ─────────────────
 * • OSM tiles qua Leaflet.js (WebView) – không cần Google Maps API key
 * • OSRM routing: driver ──► store ──► customer  (polyline thực sự trên đường)
 * • Real-time driver marker update qua injectJavaScript (không reload map)
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
  StatusBar,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { useAuthStore, useDriverStore } from '../store/useStore';
import socketService from '../services/socketService';
import apiClient, { fetchOSRMRoute } from '../services/apiClient';
import OsmMap from '../components/OsmMap';

const PRIMARY = '#ff6b35';
const PRIMARY_LIGHT = '#fff3ee';

// ─── Status configuration ─────────────────────────────────────────────────────
const STATUS_FLOW = [
  {
    key: 'DRIVER_ACCEPTED',
    label: 'Đã nhận đơn',
    icon: '✓',
    color: PRIMARY,
    next: 'PICKING_UP',
    nextLabel: 'Bắt đầu lấy hàng',
  },
  {
    key: 'PICKING_UP',
    label: 'Đang lấy hàng',
    icon: '🏪',
    color: '#f39c12',
    next: 'DELIVERING',
    nextLabel: 'Bắt đầu giao hàng',
  },
  {
    key: 'DELIVERING',
    label: 'Đang giao hàng',
    icon: '🛵',
    color: '#8e44ad',
    next: 'COMPLETED',
    nextLabel: 'Hoàn thành giao hàng',
  },
  {
    key: 'COMPLETED',
    label: 'Đã hoàn thành',
    icon: '🎉',
    color: '#27ae60',
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

  const mapWebViewRef = useRef(null); // ref tới WebView bên trong OsmMap
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
    // Lấy vị trí ngay lập tức (không đợi distanceFilter)
    Geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { latitude: coords.latitude, longitude: coords.longitude };
        setDriverLocation(loc);
        socketService.updateDriverLocation(orderId, coords.latitude, coords.longitude, user?.id);
      },
      (err) => console.warn('getCurrentPosition error', err.code, err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    // Tiếp tục watch để cập nhật real-time
    watchIdRef.current = Geolocation.watchPosition(
      ({ coords }) => {
        const loc = { latitude: coords.latitude, longitude: coords.longitude };
        setDriverLocation(loc);
        socketService.updateDriverLocation(orderId, coords.latitude, coords.longitude, user?.id);
        // Inject JS vào WebView để update marker driver không cần reload
        if (mapWebViewRef.current) {
          const msg = JSON.stringify({ type: 'UPDATE_DRIVER', lat: coords.latitude, lng: coords.longitude, color: '#2196F3' });
          mapWebViewRef.current.injectJavaScript(`handleMessage(${JSON.stringify(msg)});true;`);
        }
      },
      (err) => console.warn('GPS watch error', err.code, err.message),
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

    // Delay nhỏ để Activity attach xong trước khi gọi PermissionsAndroid
    const timer = setTimeout(() => {
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
    }, 300);

    return () => {
      clearTimeout(timer);
      if (watchIdRef.current != null) Geolocation.clearWatch(watchIdRef.current);
      socketService.leaveOrder(orderId);
      socketService.off('ORDER_STATUS_CHANGED');
    };
  }, []);

  // Rebuild route when order data arrives
  useEffect(() => {
    if (driverLocation && order) buildRoute(driverLocation, order);
  }, [order]);

  // Trigger buildRoute lần đầu khi GPS lock (driverLocation từ null → có giá trị)
  const routeBuiltRef = useRef(false);
  useEffect(() => {
    if (driverLocation && order && !routeBuiltRef.current) {
      routeBuiltRef.current = true;
      buildRoute(driverLocation, order);
    }
  }, [driverLocation, order]);

  // ─── Fit map to all waypoints ────────────────────────────────────────────────
  const fitToRoute = () => {
    if (!mapWebViewRef.current) return;
    mapWebViewRef.current.injectJavaScript(
      `handleMessage(${JSON.stringify(JSON.stringify({ type: 'FIT_BOUNDS' }))});true;`
    );
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

  // Chuyển routeSegments thành prop 'route' cho OsmMap
  // Đoạn xanh dương: driver → store | Đoạn cam: store → khách hàng
  const routeProp = [
    ...(routeSegments.toStore.length > 1
      ? [{ coords: routeSegments.toStore, color: '#1565C0', weight: 5 }]
      : []),
    ...(routeSegments.toUser.length > 1
      ? [{ coords: routeSegments.toUser, color: '#E65100', weight: 5 }]
      : []),
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />
      {/* ══════════════ MAP ══════════════ */}
      <OsmMap
        style={styles.map}
        region={initialRegion}
        webViewRef={mapWebViewRef}
        route={routeProp}
        onReady={fitToRoute}
        markers={[
          ...(driverLocation
            ? [{ id: 'driver', coordinate: driverLocation, title: 'Tài xế', type: 'driver', color: '#2196F3' }]
            : []),
          ...(storeLoc
            ? [{ id: 'store', coordinate: storeLoc, title: order.store?.name ?? 'Cửa hàng', type: 'store', color: '#FF6F00' }]
            : []),
          { id: 'dest', coordinate: destLoc, title: 'Khách hàng', type: 'destination', color: '#E53935' },
        ]}
      />

      {/* Fit-to-route button */}
      <TouchableOpacity style={styles.fitButton} onPress={fitToRoute}>
        <Text style={{ fontSize: 18 }}>🗺️</Text>
      </TouchableOpacity>

      {/* Route loading overlay */}
      {loadingRoute && (
        <View style={styles.routeLoader}>
          <ActivityIndicator size="small" color={PRIMARY} />
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
                  <Text style={{ fontSize: 11, color: (passed || active) ? '#fff' : '#bbb', fontWeight: 'bold' }}>
                    {passed ? '✓' : s.icon}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    active && { color: s.color, fontWeight: '700' },
                    passed && { color: '#27ae60' },
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
          <View style={[styles.actionBtn, { backgroundColor: '#27ae60' }]}>
            <Text style={styles.actionBtnText}>🎉 Đã giao hàng thành công!</Text>
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

  fitButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  routeLoaderText: { marginLeft: 6, fontSize: 12, color: '#555' },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelinePassed: { backgroundColor: '#e8f8ee', borderColor: '#27ae60' },
  timelineLabel: { fontSize: 9, color: '#bbb', marginTop: 5, textAlign: 'center', lineHeight: 12 },
  timelineLine: { flex: 0.25, height: 2, backgroundColor: '#eee', marginTop: 14 },
  timelineLinePassed: { backgroundColor: '#27ae60' },

  // Info card
  infoCard: {
    backgroundColor: '#fff',
    padding: 14,
    maxHeight: 230,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { fontSize: 17, marginRight: 8, marginTop: 2, width: 24 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#333' },
  infoSub: { fontSize: 12, color: '#666', marginTop: 2, lineHeight: 17 },
  infoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 10,
    flexWrap: 'wrap',
    gap: 4,
  },
  metaItem: { fontSize: 12, color: '#444', fontWeight: '500' },
  actionBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  disabledBtn: { opacity: 0.6 },
});

export default DeliveryMapScreen;
