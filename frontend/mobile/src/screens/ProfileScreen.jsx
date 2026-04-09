import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, StatusBar, Platform, PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore, useDriverStore } from '../store/useStore';
import apiClient from '../services/apiClient';
import socketService from '../services/socketService';

const PRIMARY = '#ff6b35';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { isOnline, setIsOnline, currentLocation, setCurrentLocation } = useDriverStore();
  const [toggling, setToggling] = useState(false);
  const [stats, setStats] = useState({ orders: 0, completed: 0, earnings: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [locationName, setLocationName] = useState('Đang xác định địa chỉ...');
  
  const watchIdRef = useRef(null);

  // Log render với locationName hiện tại
  // (Logs sau debug - có thể remove sau khi fix)
  // console.log('[ProfileScreen render] locationName:', locationName);


  const handleToggleStatus = async () => {
    try {
      setToggling(true);
      const { token, user: currentUser } = useAuthStore.getState();
      if (!currentUser?.id) {
        Alert.alert('Lỗi', 'Chưa tải được thông tin người dùng, thử lại');
        return;
      }
      const response = await apiClient.toggleDriverStatus(token);
      if (response.success) {
        const newOnline = !isOnline;
        setIsOnline(newOnline);
        if (newOnline) socketService.driverOnline(currentUser.id);
        else socketService.driverOffline(currentUser.id);
      } else {
        Alert.alert('Lỗi', response.message);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    } finally {
      setToggling(false);
    }
  };

  const startLocationWatch = useCallback(async () => {
    const startWatch = () => {
      watchIdRef.current = Geolocation.watchPosition(
        ({ coords }) => {
          const loc = { latitude: coords.latitude, longitude: coords.longitude };
          setCurrentLocation(loc);
        },
        (err) => {
          console.warn('[ProfileScreen GPS error]', err.code, err.message);
        },
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
            message: 'Ứng dụng cần truy cập vị trí để hiển thị địa chỉ của bạn.',
            buttonPositive: 'Cho phép',
            buttonNegative: 'Từ chối',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          startWatch();
        }
      } catch (err) {
        console.warn('Permission error in ProfileScreen', err);
      }
    }
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const { token } = useAuthStore.getState();
      if (!token) {
        console.warn('No token available');
        return;
      }
      // Lấy thống kê hôm nay
      const response = await apiClient.getDriverStats(token);
      console.log('[loadStats] Response:', response);
      
      // API trả về { success, message, data: {...} }
      const data = response.data || response;
      if (data) {
        setStats({
          orders: parseInt(data.totalOrders) || 0,
          completed: parseInt(data.completedOrders) || 0,
          earnings: parseFloat(data.earnings) || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
    startLocationWatch();

    return () => {
      // Cleanup: Dừng watch khi rời khỏi screen
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startLocationWatch]);

  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      // Display GPS in simple format (latitude, longitude in degrees)
      // Format: 10.85°, 106.77° (2 decimal places for readability)
      const displayName = `${currentLocation.latitude.toFixed(2)}°, ${currentLocation.longitude.toFixed(2)}°`;
      setLocationName(displayName);
    }
  }, [currentLocation]);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive',
        onPress: () => { logout(); navigation.replace('Login'); },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#888' }}>Đang tải...</Text>
      </View>
    );
  }

  const initials = user.username?.slice(0, 2).toUpperCase() ?? 'DX';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user.username}</Text>
        <Text style={styles.userRole}>🛵 Tài xế giao hàng</Text>
        <View style={[styles.onlineBadge, isOnline ? styles.badgeOnline : styles.badgeOffline]}>
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#4caf50' : '#f44336' }]} />
          <Text style={[styles.badgeText, { color: isOnline ? '#4caf50' : '#f44336' }]}>
            {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
          </Text>
        </View>
      </View>

      {/* ── TOGGLE ── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.toggleBtn, isOnline ? styles.toggleBtnOff : styles.toggleBtnOn]}
          onPress={handleToggleStatus}
          disabled={toggling}
        >
          <MaterialCommunityIcons
            name={isOnline ? 'toggle-switch' : 'toggle-switch-off'}
            size={24} color="#fff"
          />
          <Text style={styles.toggleBtnText}>
            {toggling ? 'Đang cập nhật...' : isOnline ? 'Tắt nhận đơn' : 'Bật nhận đơn'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── THÔNG TIN ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin tài xế</Text>
        <InfoRow icon="account-outline" label="Họ tên" value={user.username} />
        <InfoRow icon="email-outline" label="Email" value={user.email} />
        <InfoRow icon="phone-outline" label="Điện thoại" value={user.phone || 'Chưa cập nhật'} />
        <InfoRow
          icon="map-marker-outline"
          label="Vị trí GPS"
          value={locationName}
        />
      </View>

      {/* ── THỐNG KÊ ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hôm nay</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="package-variant"
            label="Đơn nhận"
            value={loadingStats ? '...' : stats.orders.toString()}
            color="#1890ff"
          />
          <StatCard
            icon="check-circle-outline"
            label="Hoàn thành"
            value={loadingStats ? '...' : stats.completed.toString()}
            color="#52c41a"
          />
          <StatCard
            icon="cash"
            label="Thu nhập"
            value={loadingStats ? '...' : `${(stats.earnings || 0).toLocaleString('vi-VN')}đ`}
            color={PRIMARY}
          />
        </View>
      </View>

      {/* ── ĐĂNG XUẤT ── */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <MaterialCommunityIcons name={icon} size={20} color={PRIMARY} style={{ width: 28 }} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

const StatCard = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <MaterialCommunityIcons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff5f0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: PRIMARY,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userRole: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, marginTop: 12,
  },
  badgeOnline: { backgroundColor: '#e8f5e9' },
  badgeOffline: { backgroundColor: '#fce4ec' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 13, fontWeight: '700' },

  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 14,
    elevation: 3, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  toggleBtnOn: { backgroundColor: '#52c41a', shadowColor: '#52c41a' },
  toggleBtnOff: { backgroundColor: '#ff4d4f', shadowColor: '#ff4d4f' },
  toggleBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  section: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff',
    borderRadius: 16, padding: 16, elevation: 2,
    shadowColor: PRIMARY, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 15, fontWeight: 'bold', color: '#222',
    marginBottom: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#fff0e8',
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#fafafa',
  },
  infoLabel: { fontSize: 13, color: '#888', width: 100, fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#333', flex: 1, fontWeight: '600', textAlign: 'right' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fafafa', borderRadius: 12,
    padding: 14, alignItems: 'center', borderTopWidth: 3,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  logoutBtn: {
    backgroundColor: '#ff4d4f', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default ProfileScreen;
