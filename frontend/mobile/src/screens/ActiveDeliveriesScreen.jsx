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
  StatusBar,
} from 'react-native';
import { useAuthStore, useDriverStore } from '../store/useStore';
import apiClient from '../services/apiClient';
import socketService from '../services/socketService';

const PRIMARY = '#ff6b35';
const PRIMARY_LIGHT = '#fff3ee';

// ─── Status flow ─────────────────────────────────────────────────────────────
const STATUS_FLOW = [
  { key: 'DRIVER_ACCEPTED', label: 'Đã nhận đơn',  icon: '✓',  color: PRIMARY },
  { key: 'PICKING_UP',      label: 'Lấy hàng',      icon: '🏪', color: '#f39c12' },
  { key: 'DELIVERING',      label: 'Đang giao',      icon: '🛵', color: '#8e44ad' },
  { key: 'COMPLETED',       label: 'Hoàn thành',     icon: '✓',  color: '#27ae60' },
];

const STATUS_ACTIONS = {
  DRIVER_ACCEPTED: { label: 'Bắt đầu lấy hàng', next: 'PICKING_UP',  color: '#f39c12' },
  PICKING_UP:      { label: 'Bắt đầu giao hàng', next: 'DELIVERING', color: '#8e44ad' },
  DELIVERING:      { label: 'Đã giao thành công', next: 'COMPLETED',  color: '#27ae60' },
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
                  passed && { backgroundColor: s.color, borderColor: s.color },
                  active && { backgroundColor: s.color, borderColor: s.color, transform: [{ scale: 1.15 }] },
                ]}
              >
                <Text style={[tStyles.dotText, (passed || active) && { color: '#fff' }]}>
                  {passed || active ? s.icon : String(i + 1)}
                </Text>
              </View>
              <Text
                style={[
                  tStyles.label,
                  active && { color: s.color, fontWeight: '700' },
                  passed && { color: s.color },
                ]}
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </View>
            {i < STATUS_FLOW.length - 1 && (
              <View style={[tStyles.line, passed && { backgroundColor: s.color }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const tStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 14, paddingHorizontal: 4 },
  step: { alignItems: 'center', flex: 1 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  dotText: { fontSize: 12, fontWeight: 'bold', color: '#bbb' },
  label: { fontSize: 9, color: '#bbb', marginTop: 5, textAlign: 'center', lineHeight: 12 },
  line: { flex: 0.25, height: 2, backgroundColor: '#eee', marginTop: 15 },
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
        {/* Top accent strip */}
        <View style={[styles.cardStrip, { backgroundColor: statusCfg?.color || PRIMARY }]} />

        <View style={styles.cardBody}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardIdLabel}>ĐƠN HÀNG</Text>
              <Text style={styles.cardId}>#{order.id}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: (statusCfg?.color || PRIMARY) + '22', borderColor: (statusCfg?.color || PRIMARY) + '55' }]}>
              <Text style={[styles.statusBadgeText, { color: statusCfg?.color || PRIMARY }]}>
                {statusCfg?.label || order.status}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <StatusTimeline currentStatus={order.status} />

          {/* Info block */}
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🏪</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{order.store?.name || 'Cửa hàng'}</Text>
                <Text style={styles.infoSub} numberOfLines={2}>{order.store?.address}</Text>
              </View>
            </View>
            <View style={styles.infoSeparator} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Giao đến</Text>
                <Text style={styles.infoSub} numberOfLines={2}>{order.delivery_address}</Text>
              </View>
            </View>
            {order.user && (
              <>
                <View style={styles.infoSeparator} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>👤</Text>
                  <Text style={styles.infoSub}>
                    {order.user.username}
                    {order.user.phone ? ` · ${order.user.phone}` : ''}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Tiền hàng</Text>
              <Text style={styles.metaValue}>{Number(order.total_price).toLocaleString('vi-VN')} đ</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Phí giao</Text>
              <Text style={[styles.metaValue, { color: PRIMARY }]}>+{Number(order.shipping_fee).toLocaleString('vi-VN')} đ</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Khoảng cách</Text>
              <Text style={styles.metaValue}>{Number(order.distance_km).toFixed(1)} km</Text>
            </View>
          </View>

          {/* Buttons */}
          {!isCompleted ? (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => handleOpenMap(order)}
              >
                <Text style={styles.mapBtnText}>🗺️  Bản đồ</Text>
              </TouchableOpacity>
              {action && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: action.color }, isUpdating && styles.disabledBtn]}
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
          ) : (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>🎉  Đã giao thành công!</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading && acceptedOrders.length === 0) {
    return (
      <View style={styles.centered}>
        <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Đang tải đơn hàng…</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />
      <FlatList
        style={styles.container}
        data={acceptedOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchActiveOrders();
            }}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.screenTitle}>Đơn hàng đang giao</Text>
            {acceptedOrders.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{acceptedOrders.length}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Chưa có đơn đang giao</Text>
            <Text style={styles.emptyHint}>Nhận đơn từ tab "Đơn có sẵn"</Text>
          </View>
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },

  listContent: { padding: 12, paddingBottom: 24 },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  countBadge: {
    marginLeft: 8,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // ── Card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardCompleted: { opacity: 0.7 },
  cardStrip: { height: 4 },
  cardBody: { padding: 14 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIdLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', letterSpacing: 0.8 },
  cardId: { fontSize: 20, fontWeight: 'bold', color: '#222', marginTop: 1 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },

  // ── Info block ──
  infoBlock: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoSeparator: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  infoIcon: { fontSize: 15, marginRight: 8, marginTop: 2, width: 22 },
  infoTitle: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 1 },
  infoSub: { fontSize: 13, color: '#333', lineHeight: 18 },

  // ── Meta row ──
  metaRow: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  metaBlock: { flex: 1, alignItems: 'center' },
  metaDivider: { width: 1, height: 28, backgroundColor: '#eee' },
  metaLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: 'bold', color: '#333' },

  // ── Buttons ──
  btnRow: { flexDirection: 'row', gap: 8 },
  mapBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    alignItems: 'center',
  },
  mapBtnText: { color: PRIMARY, fontWeight: '700', fontSize: 13 },
  actionBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  disabledBtn: { opacity: 0.55 },

  completedBanner: {
    backgroundColor: '#e8f8ee',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b7e4c7',
  },
  completedText: { color: '#27ae60', fontWeight: 'bold', fontSize: 14 },

  // ── Empty ──
  emptyContainer: { alignItems: 'center', paddingVertical: 70, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#444', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#aaa', textAlign: 'center' },
});

export default ActiveDeliveriesScreen;
