import React, { useEffect, useCallback, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Button, Avatar, message, Space, Tooltip, Badge, Modal, Input } from 'antd';
import { LogoutOutlined, UserOutlined, SafetyOutlined, ShoppingCartOutlined, FileTextOutlined, TruckOutlined } from '@ant-design/icons';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore, useLocationStore, useOrderStore } from './store/useStore';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StoreDiscovery from './pages/StoreDiscovery';
import StoreMenu from './pages/StoreMenu';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';
import AdminDashboard from './pages/AdminDashboard';
import OTPVerificationPage from './pages/OTPVerificationPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import Cart from './components/Cart';
import './styles/App.css';

const { Header, Content } = Layout;

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Layout chính sau khi đăng nhập
function MainLayout() {
  const { user, token, logout } = useAuthStore();
  const { userLocation, userAddress, setUserLocation, setUserAddress } = useLocationStore();
  const { cart } = useOrderStore();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');

  // Reverse geocode: convert lat/lng to address using Nominatim
  const getAddressFromCoords = useCallback(async (lat, lng) => {
    try {
      console.log('getAddressFromCoords called with lat:', lat, 'lng:', lng);
      
      // Hardcode for testing - Thủ Đức, TP.HCM area
      if (lat >= 10.8 && lat <= 10.9 && lng >= 106.7 && lng <= 106.8) {
        console.log('Matched hardcode range - setting address to Thủ Đức, TP.HCM');
        setUserAddress('Thủ Đức, TP.HCM');
        return;
      }
      
      console.log('Outside hardcode range, trying Nominatim...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`,
        { 
          headers: { 
            'User-Agent': 'SmartFood-App'
          } 
        }
      );
      
      if (!response.ok) throw new Error('Nominatim error');
      
      const data = await response.json();
      console.log('Nominatim response:', data);
      
      // Extract meaningful address parts
      const address = data.address || {};
      let addressParts = [];
      
      // Thêm đường
      if (address.road) addressParts.push(address.road);
      else if (address.pedestrian) addressParts.push(address.pedestrian);
      else if (address.house_number) addressParts.push(address.house_number);
      
      // Thêm phường/quận
      if (address.suburb) addressParts.push(address.suburb);
      else if (address.district) addressParts.push(address.district);
      else if (address.city_district) addressParts.push(address.city_district);
      
      // Thêm thành phố
      if (address.city) addressParts.push(address.city);
      else if (address.province) addressParts.push(address.province);
      else if (address.country) addressParts.push(address.country);
      
      const addressStr = addressParts.filter(Boolean).join(', ');
      const finalAddress = addressStr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      console.log('Final address:', finalAddress);
      setUserAddress(finalAddress);
    } catch (err) {
      console.error('Geocoding error:', err);
      setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        ({ coords }) => {
          console.log('Geolocation updated:', coords.latitude, coords.longitude);
          setUserLocation({ lat: coords.latitude, lng: coords.longitude });
          getAddressFromCoords(coords.latitude, coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          message.warning('Vui lòng bật dịch vụ định vị');
          // Fallback: Use Thu Duc, TP.HCM for testing
          setUserLocation({ lat: 10.844, lng: 106.789 });
          getAddressFromCoords(10.844, 106.789);
        }
      );
    } else {
      // Fallback: Use Thu Duc, TP.HCM for testing if geolocation not available
      setUserLocation({ lat: 10.844, lng: 106.789 });
      getAddressFromCoords(10.844, 106.789);
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
        <Space size={24}>
          {userLocation && (
            <Tooltip title={`${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 150 }}>
                <span style={{ fontSize: 14 }}>📍</span>
                <small style={{ color: '#999', fontSize: 12, cursor: 'help', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {userAddress}
                </small>
              </div>
            </Tooltip>
          )}

          <Tooltip title="Giỏ hàng">
            <Badge count={cart.length} showZero style={{ backgroundColor: '#ff6b35' }}>
              <Button
                type="text"
                icon={<ShoppingCartOutlined />}
                style={{ color: '#333', fontSize: 18, padding: '4px 8px' }}
                onClick={() => setCartOpen(true)}
              />
            </Badge>
          </Tooltip>

          <Tooltip title="Cài đặt bảo mật / 2FA">
            <Button
              type="text"
              icon={<SafetyOutlined />}
              style={{ color: user?.two_factor_enabled ? '#52c41a' : '#faad14', padding: '4px 8px' }}
              onClick={() => navigate('/security')}
            />
          </Tooltip>

          <Tooltip title="Theo dõi đơn hàng">
            <Button
              type="text"
              icon={<TruckOutlined />}
              style={{ color: '#ff6b35', padding: '4px 8px' }}
              onClick={() => setTrackingModalOpen(true)}
            />
          </Tooltip>

          <Tooltip title="Lịch sử đơn hàng">
            <Button
              type="text"
              icon={<FileTextOutlined />}
              style={{ color: '#1890ff', padding: '4px 8px' }}
              onClick={() => navigate('/orders')}
            />
          </Tooltip>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              src={user?.image_url}
              icon={!user?.image_url && <UserOutlined />}
              style={{ background: '#ff6b35' }}
              size={32}
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
            <Route path="/store/:storeId" element={<StoreMenu token={token} />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:orderId" element={<OrderTracking token={token} />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/security" element={<SecuritySettingsPage />} />
            <Route
              path="/admin"
              element={user?.role === 'admin' ? <AdminDashboard token={token} /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Content>
      </Layout>

      {/* Cart Drawer */}
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Tracking Order Modal */}
      <Modal
        title="🚚 Theo dõi đơn hàng"
        open={trackingModalOpen}
        onCancel={() => {
          setTrackingModalOpen(false);
          setTrackingOrderId('');
        }}
        onOk={() => {
          if (!trackingOrderId.trim()) {
            message.warning('Vui lòng nhập mã đơn hàng');
            return;
          }
          navigate(`/order/${trackingOrderId}`);
          setTrackingModalOpen(false);
          setTrackingOrderId('');
        }}
        okText="Theo dõi"
        cancelText="Đóng"
      >
        <div style={{ marginTop: 16 }}>
          <Input
            placeholder="Nhập mã đơn hàng (ví dụ: 5)"
            value={trackingOrderId}
            onChange={(e) => setTrackingOrderId(e.target.value)}
            onPressEnter={() => {
              if (trackingOrderId.trim()) {
                navigate(`/order/${trackingOrderId}`);
                setTrackingModalOpen(false);
                setTrackingOrderId('');
              }
            }}
            style={{ marginBottom: 8 }}
          />
          <small style={{ color: '#999' }}>Nhập số mã đơn hàng của bạn để xem chi tiết và theo dõi vị trí giao hàng</small>
        </div>
      </Modal>
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
