import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../store/useStore';
import apiClient from '../services/apiClient';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  const { setToken, setUser, setLoading: setAuthLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.login(email, password);

      if (response.success && response.data.user.role === 'driver') {
        await setToken(response.data.token);
        await setUser(response.data.user);
        navigation.replace('Main');
      } else {
        Alert.alert('Đăng nhập thất bại', 'Sai thông tin hoặc tài khoản không phải tài xế');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng nhập thất bại, vui lòng thử lại');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !email || !password || !phone) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.register({
        username,
        email,
        password,
        phone,
        role: 'driver',
      });

      if (response.success) {
        await setToken(response.data.token);
        await setUser(response.data.user);
        navigation.replace('Main');
      } else {
        Alert.alert('Đăng ký thất bại', response.message);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng ký thất bại, vui lòng thử lại');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#ff6b35" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🛵</Text>
          </View>
          <Text style={styles.appName}>SmartFood Driver</Text>
          <Text style={styles.appSlogan}>Giao hàng nhanh – Kiếm tiền dễ</Text>
        </View>

        {/* ── TAB ── */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, !isRegister && styles.tabActive]}
            onPress={() => setIsRegister(false)}
          >
            <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, isRegister && styles.tabActive]}
            onPress={() => setIsRegister(true)}
          >
            <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        {/* ── FORM ── */}
        <View style={styles.formCard}>
          {isRegister && (
            <>
              <Text style={styles.label}>👤 Tên tài xế</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên của bạn"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#bbb"
              />
              <Text style={styles.label}>📞 Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="0123 456 789"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#bbb"
              />
            </>
          )}

          <Text style={styles.label}>✉️ Email</Text>
          <TextInput
            style={styles.input}
            placeholder="driver@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#bbb"
          />

          <Text style={styles.label}>🔒 Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#bbb"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? '🚀 Tạo tài khoản' : '🛵 Đăng nhập'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── FOOTER ── */}
        <Text style={styles.footerText}>
          {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <Text style={styles.footerLink} onPress={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
          </Text>
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const PRIMARY = '#ff6b35';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff5f0' },
  contentContainer: { paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: PRIMARY,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 26, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  appSlogan: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  // Tab
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#ffe5d9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 14, fontWeight: '600', color: '#ff6b35' },
  tabTextActive: { color: '#fff' },

  // Form
  formCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#ff6b35',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.5,
    borderColor: '#ffe0cc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fffaf8',
    color: '#333',
  },
  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    elevation: 3,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Footer
  footerText: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' },
  footerLink: { color: PRIMARY, fontWeight: 'bold' },
});

export default LoginScreen;
