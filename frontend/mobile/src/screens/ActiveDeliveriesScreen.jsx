/**
 * ActiveDeliveriesScreen
 * ──────────────────────
 * • Danh sách đơn hàng driver đang nhận (DRIVER_ACCEPTED / PICKING_UP / DELIVERING)
 * • Status timeline trực quan: Đã nhận → Đang lấy hàng → Đang giao → Hoàn thành
 * • Real-time cập nhật qua Socket.IO
 * • Nút mở DeliveryMapScreen với route OSM/OSRM
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuthStore, useDriverStore } from '../store/useStore';
import apiClient from '../services/apiClient';
import socketService from '../services/socketService';

// ─── Status flow (same as DeliveryMapScreen) ─────────────────────────────────
const STATUS_FLOW = [
  { key: 'DRIVER_ACCEPTED', label: 'Đã nhận đơn',   icon: '✅', color: '#0066cc' },
  { key: 'PICKING_UP',      label: 'Lấy hàng',       icon: '🏪', color: '#ff9500' },
  { key: 'DELIVERING',      label: 'Đang giao',       icon: '🛵', color: '#9b59b6' },
  { key: 'COMPLETED',       label: 'Hoàn thành',      icon: '🎉', color: '#00cc66' },
];

const STATUS_ACTIONS = {
  DRIVER_ACCEPTED: { label: '📍 Bắt đầu lấy hàng', next: 'PICKING_UP', color: '#ff9500' },
  PICKING_UP:      { label: '🛵 Bắt đầu giao hàng', next: 'DELIVERING', color: '#9b59b6' },
  DELIVERING:      { label: '✅ Đã giao hàng',       next: 'COMPLETED',  color: '#00cc66' },
};

const getStatusConfig = (status) => STATUS_FLOW.find((s) => s.key === status);

// ─── Mini timeline component ──────────────────────────────────────────────────
const StatusTimeline = ({ currentStatus }) => {
  const activeIdx = STATUS_FLOW.findIndex((s) => s.key === currentStatus);
  return (
    <View style={tStyles.row}>
      {STATUS_FLOW.map((s, i) => {
        const passed = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s.key}>
            <View style={tStyles.step}>
              <View
                style={[
                  tStyles.dot,
                  passed && tStyles.dotPassed,
                  active && { backgroundColor: s.color, borderColor: s.color },
                ]}
              >
                <Text style={tStyles.dotText}>{passed ? '✓' : s.icon}</Text>
              </View>
              <Text
                style={[
                  tStyles.label,
                  active && { color: s.color, fontWeight: 'bold' },
                  passed && tStyles.labelPassed,
                ]}
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </View>
            {i < STATUS_FLOW.length - 1 && (
              <View style={[tStyles.line, passed && tStyles.linePassed]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const tStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 10 },
  step: { alignItems: 'center', flex: 1 },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotPassed: { backgroundColor: '#e8f5e9', borderColor: '#00cc66' },
  dotText: { fontSize: 11 },
  label: { fontSize: 9, color: '#aaa', marginTop: 4, textAlign: 'center' },
  labelPassed: { color: '#00cc66' },
  line: { flex: 0.3, height: 2, backgroundColor: '#ddd', marginTop: 14 },
  linePassed: { backgroundColor: '#00cc66' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
const ActiveDeliveriesScreen = ({ navigation }) => {
  const { token, user } = useAuthStore();
  const {
    acceptedOrders,
    setAcceptedOrders,
    setCurrentOrder,
    updateOrderStatusInList,
  } = useDriverStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null); // orderId being updated

  // ─── Fetch active orders ──────────────────────────────────────────────────
  const fetchActiveOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getDriverOrders(token);
      if (res.success) {
        setAcceptedOrders(res.data);
        // Re-join socket rooms for all active orders
        res.data.forEach((o) => socketService.joinOrder(o.id, user?.id));
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.id]);

  // ─── Update status ────────────────────────────────────────────────────────
  const handleUpdateStatus = (order, nextStatus) => {
    const labels = {
      PICKING_UP: 'Xác nhận bắt đầu lấy hàng tại cửa hàng?',
      DELIVERING: 'Xác nhận đã lấy hàng và bắt đầu giao?',
      COMPLETED:  'Xác nhận đã giao hàng thành công cho khách?',
    };
    Alert.alert('Cập nhật trạng thái', labels[nextStatus] || 'Tiếp tục?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          setUpdatingId(order.id);
          try {
            const res = await apiClient.updateOrderStatus(token, order.id, nextStatus);
            if (res.success) {
              socketService.emitOrderStatusUpdate(order.id, nextStatus);
              updateOrderStatusInList(order.id, nextStatus);
            } else {
              Alert.alert('Lỗi', res.message || 'Không thể cập nhật');
            }
          } catch {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  // ─── Open map screen ─────────────────────────────────────────────────────
  const handleOpenMap = (order) => {
    setCurrentOrder(order);
    navigation.navigate('DeliveryMap', { orderId: order.id });
  };

  // ─── Setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchActiveOrders();
    socketService.connect(token);

    socketService.onOrderStatusChanged(({ orderId, status }) => {
      updateOrderStatusInList(orderId, status);
    });

    return () => {
      socketService.off('ORDER_STATUS_CHANGED');
    };
  }, []);

  // ─── Render order card ────────────────────────────────────────────────────
  const renderOrderCard = ({ item: order }) => {
    const statusCfg = getStatusConfig(order.status);
    const action = STATUS_ACTIONS[order.status];
    const isUpdating = updatingId === order.id;
    const isCompleted = order.status === 'COMPLETED';

    return (
      <View style={[styles.card, isCompleted && styles.cardCompleted]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardOrderId}>📦 Đơn #{order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg?.color + '22' }]}>
            <Text style={[styles.statusBadgeText, { color: statusCfg?.color }]}>
              {statusCfg?.icon} {statusCfg?.label}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <StatusTimeline currentStatus={order.status} />

        {/* Store */}
        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏪</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>{order.store?.name || 'Cửa hàng'}</Text>
              <Text style={styles.infoSub}>{order.store?.address}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { marginTop: 6 }]}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Địa chỉ giao</Text>
              <Text style={styles.infoSub}>{order.delivery_address}</Text>
            </View>
          </View>
          {order.user && (
            <View style={[styles.infoRow, { marginTop: 6 }]}>
              <Text style={styles.infoIcon}>�</Text>
              <Text style={styles.infoSub}>
                {order.user.username}
                {order.user.phone ? ` · ${order.user.phone}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>
            💰 {Number(order.total_price).toLocaleString('vi-VN')} đ
          </Text>
          <Text style={styles.metaItem}>
            📏 {Number(order.distance_km).toFixed(1)} km
          </Text>
          <Text style={styles.metaItem}>
            🚚 +{Number(order.shipping_fee).toLocaleString('vi-VN')} đ
          </Text>
        </View>

        {/* Buttons */}
        {!isCompleted && (
          <View style={styles.btnRow}>
            {/* Open map */}
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => handleOpenMap(order)}
            >
              <Text style={styles.mapBtnText}>🗺️ Xem bản đồ</Text>
            </TouchableOpacity>

            {/* Status action */}
            {action && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: action.color },
                  isUpdating && styles.disabledBtn,
                ]}
                onPress={() => handleUpdateStatus(order, action.next)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>{action.label}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>🎉 Đơn hàng đã hoàn thành</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading && acceptedOrders.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={acceptedOrders}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderOrderCard}
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchActiveOrders();
          }}
          colors={['#0066cc']}
        />
      }
      ListHeaderComponent={
        <Text style={styles.screenTitle}>🚚 Đơn hàng đang giao</Text>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Không có đơn hàng nào đang giao</Text>
          <Text style={styles.emptyHint}>Nhận đơn từ tab "Đơn có sẵn"</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  cardCompleted: { opacity: 0.75 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardOrderId: { fontSize: 15, fontWeight: 'bold', color: '#222' },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },

  // Info block
  infoBlock: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { fontSize: 16, marginRight: 8, marginTop: 1 },
  infoTitle: { fontSize: 13, fontWeight: '600', color: '#333' },
  infoSub: { fontSize: 12, color: '#666', marginTop: 1, flex: 1 },

  // Meta
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaItem: { fontSize: 12, color: '#444' },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  mapBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#0066cc',
    alignItems: 'center',
  },
  mapBtnText: { color: '#0066cc', fontWeight: '600', fontSize: 13 },
  actionBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  disabledBtn: { opacity: 0.55 },

  completedBanner: {
    marginTop: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  completedText: { color: '#00aa55', fontWeight: 'bold', fontSize: 14 },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '600' },
  emptyHint: { fontSize: 13, color: '#aaa', marginTop: 4 },
});

export default ActiveDeliveriesScreen;
