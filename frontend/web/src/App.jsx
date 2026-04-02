import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Button, Avatar, message, Space, Tooltip } from 'antd';
import { LogoutOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore, useLocationStore } from './store/useStore';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StoreDiscovery from './pages/StoreDiscovery';
import OrderTracking from './pages/OrderTracking';
import AdminDashboard from './pages/AdminDashboard';
import OTPVerificationPage from './pages/OTPVerificationPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import './styles/App.css';

const { Header, Content } = Layout;

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Layout chính sau khi đăng nhập
function MainLayout() {
  const { user, token, logout } = useAuthStore();
  const { userLocation, setUserLocation } = useLocationStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
        () => message.warning('Vui lòng bật dịch vụ định vị')
      );
    }
  }, []);

  const handleLogout = () => {
    logout();
    message.success('Đã đăng xuất');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fff', borderBottom: '1px solid #ffe4cc',
        boxShadow: '0 2px 12px rgba(255,107,53,0.08)',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo + nav */}
        <Space size={32} align="center">
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => navigate('/')}
          >
            <span style={{ fontSize: 24 }}>🍔</span>
            <span style={{ color: '#ff6b35', fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
              SmartFood
            </span>
          </div>
          <Space size={4}>
            <Button type="text" style={{ color: '#333', fontWeight: 500 }} onClick={() => navigate('/')}>
              Trang chủ
            </Button>
            <Button type="text" style={{ color: '#333', fontWeight: 500 }} onClick={() => navigate('/stores')}>
              Quán ăn
            </Button>
            {user?.role === 'admin' && (
              <Button type="text" style={{ color: '#333', fontWeight: 500 }} onClick={() => navigate('/admin')}>
                Quản trị
              </Button>
            )}
          </Space>
        </Space>

        {/* Right side */}
        <Space>
          {userLocation && (
            <small style={{ color: '#999', fontSize: 12 }}>
              📍 {userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}
            </small>
          )}

          <Tooltip title="Cài đặt bảo mật / 2FA">
            <Button
              type="text"
              icon={<SafetyOutlined />}
              style={{ color: user?.two_factor_enabled ? '#52c41a' : '#faad14' }}
              onClick={() => navigate('/security')}
            />
          </Tooltip>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              src={user?.image_url}
              icon={!user?.image_url && <UserOutlined />}
              style={{ background: '#ff6b35' }}
            />
            <span style={{ color: '#333', fontWeight: 600, fontSize: 13 }}>{user?.username}</span>
          </div>

          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              borderColor: '#ff6b35', color: '#ff6b35',
              borderRadius: 20, fontWeight: 600,
            }}
          >
            Đăng xuất
          </Button>
        </Space>
      </Header>

      <Layout>
        <Content style={{ padding: 0 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stores" element={<StoreDiscovery token={token} userLocation={userLocation} />} />
            <Route path="/order/:orderId" element={<OrderTracking token={token} />} />
            <Route path="/security" element={<SecuritySettingsPage />} />
            <Route
              path="/admin"
              element={user?.role === 'admin' ? <AdminDashboard token={token} /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  const { token, requires2FA } = useAuthStore();

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          {/* OTP verification — truy cập được khi chưa có token đầy đủ */}
          <Route path="/verify-otp" element={<OTPVerificationPage />} />

          {/* Chưa đăng nhập → LoginPage */}
          <Route
            path="*"
            element={token ? <MainLayout /> : <LoginPage />}
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
