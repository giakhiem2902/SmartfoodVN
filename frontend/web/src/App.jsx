import React, { useEffect, useCallback, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Button, Avatar, message, Space, Tooltip, Badge, Modal, Dropdown, Card, Tag, Spin, Row, Col, Empty, Divider } from 'antd';
import { LogoutOutlined, UserOutlined, ShoppingCartOutlined, UserSwitchOutlined, SafetyOutlined, TruckOutlined, ShopOutlined } from '@ant-design/icons';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore, useLocationStore, useOrderStore } from './store/useStore';
import apiClient from './services/apiClient';
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
import UserProfile from './pages/UserProfile';
import StoreRegistrationPage from './pages/StoreRegistrationPage';
import StoreDashboard from './pages/StoreDashboard';
import Cart from './components/Cart';
import './styles/App.css';

const { Header, Content } = Layout;

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const GOOGLE_OAUTH_ENABLED = Boolean(GOOGLE_CLIENT_ID);

// Layout chính sau khi đăng nhập
function MainLayout() {
  const { user, token, logout } = useAuthStore();
  const { userLocation, userAddress, setUserLocation, setUserAddress } = useLocationStore();
  const { cart } = useOrderStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingOrders, setTrackingOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Reverse geocode: convert lat/lng to address using Nominatim
  const getAddressFromCoords = useCallback(async (lat, lng) => {
    try {
      // Hardcode for testing - Thủ Đức, TP.HCM area
      if (lat >= 10.8 && lat <= 10.9 && lng >= 106.7 && lng <= 106.8) {
        setUserAddress('Thủ Đức, TP.HCM');
        return;
      }
      
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

  const fetchTrackingOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await apiClient.getUserOrders();
      if (response && Array.isArray(response)) {
        setTrackingOrders(response);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenTrackingModal = () => {
    fetchTrackingOrders();
    setTrackingModalOpen(true);
  };

  const headerNavItems = [
    { key: 'home', label: 'Trang chủ', path: '/' },
    { key: 'stores', label: 'Quán ăn', path: '/stores' },
    { key: 'orders', label: 'Đơn hàng của tôi', path: '/orders' },
    ...(user?.role === 'user'
      ? [{ key: 'become-store', label: 'Đăng ký bán hàng', path: '/become-store' }]
      : []),
    ...(user?.role === 'store'
      ? [
          { key: 'store-dashboard', label: 'Quản lý cửa hàng', path: '/store-dashboard' },
          { key: 'store-tracking', label: 'Theo dõi đơn hàng', action: handleOpenTrackingModal },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [
          { key: 'admin', label: 'Quản trị', path: '/admin' },
          { key: 'admin-tracking', label: 'Theo dõi đơn hàng', action: handleOpenTrackingModal },
        ]
      : []),
    ...(user?.role === 'driver'
      ? [{ key: 'driver-tracking', label: 'Theo dõi đơn hàng', action: handleOpenTrackingModal }]
      : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fff', borderBottom: '1px solid #ffe4cc',
        boxShadow: '0 2px 12px rgba(255,107,53,0.08)',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo + nav */}
        <Space size={32} align="center" wrap>
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => navigate('/')}
          >
            <span style={{ fontSize: 24 }}>🍔</span>
            <span style={{ color: '#ff6b35', fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
              SmartFood
            </span>
          </div>
          <Space size={4} wrap>
            {headerNavItems.map((item) => {
              const isActive = item.path
                ? item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)
                : false;

              return (
                <Button
                  key={item.key}
                  type="text"
                  style={{
                    color: isActive ? '#ff6b35' : '#333',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? '#fff3eb' : 'transparent',
                    borderRadius: 999,
                  }}
                  onClick={() => (item.action ? item.action() : navigate(item.path))}
                >
                  {item.label}
                </Button>
              );
            })}
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

          {/* Profile Dropdown Menu */}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  label: 'Thông tin cá nhân',
                  icon: <UserSwitchOutlined />,
                  onClick: () => navigate('/profile'),
                },
                {
                  key: 'security',
                  label: 'Bảo mật 2 lớp',
                  icon: <SafetyOutlined />,
                  onClick: () => navigate('/security'),
                },
                {
                  key: 'orders',
                  label: 'Đơn hàng của tôi',
                  icon: <ShoppingCartOutlined />,
                  onClick: () => navigate('/orders'),
                },
                ...(user?.role === 'user'
                  ? [{
                      key: 'become-store',
                      label: 'Đăng ký bán hàng',
                      icon: <ShopOutlined />,
                      onClick: () => navigate('/become-store'),
                    }]
                  : []),
                ...(user?.role === 'store'
                  ? [{
                      key: 'store-dashboard',
                      label: 'Quản lý cửa hàng',
                      icon: <ShopOutlined />,
                      onClick: () => navigate('/store-dashboard'),
                    }]
                  : []),
                {
                  key: 'tracking',
                  label: 'Theo dõi đơn hàng',
                  icon: <TruckOutlined />,
                  onClick: handleOpenTrackingModal,
                },
                {
                  type: 'divider',
                },
                {
                  key: 'logout',
                  label: 'Đăng xuất',
                  icon: <LogoutOutlined />,
                  onClick: handleLogout,
                  danger: true,
                },
              ],
            }}
            placement="bottomRight"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar
                src={user?.image_url}
                icon={!user?.image_url && <UserOutlined />}
                style={{ background: '#ff6b35' }}
                size={32}
              />
              <span style={{ color: '#333', fontWeight: 600, fontSize: 13 }}>{user?.username}</span>
            </div>
          </Dropdown>
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
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/security" element={<SecuritySettingsPage />} />
            <Route
              path="/become-store"
              element={user?.role === 'user' ? <StoreRegistrationPage /> : <Navigate to="/" />}
            />
            <Route
              path="/store-dashboard"
              element={user?.role === 'store' ? <StoreDashboard /> : <Navigate to="/" />}
            />
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
        title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>🚚 Theo dõi đơn hàng</span>}
        open={trackingModalOpen}
        onCancel={() => setTrackingModalOpen(false)}
        width={900}
        footer={null}
        styles={{ body: { maxHeight: '600px', overflowY: 'auto' } }}
      >
        <Spin spinning={loadingOrders}>
          {trackingOrders.length > 0 ? (
            <div>
              <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#f0f5ff', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#1890ff' }}>
                  📋 Tổng cộng <strong>{trackingOrders.length}</strong> đơn hàng
                </p>
              </div>

              <Row gutter={[16, 16]}>
                {trackingOrders.map((order) => {
                  const statusColors = {
                    PENDING: { color: 'orange', text: '⏳ Đợi cửa hàng xác nhận' },
                    CONFIRMED: { color: 'blue', text: '👨‍🍳 Quán đang làm món cho bạn' },
                    FINDING_DRIVER: { color: 'cyan', text: '🔎 Quán đang tìm tài xế' },
                    DRIVER_ACCEPTED: { color: 'green', text: '🤝 Tài xế đã nhận đơn' },
                    PICKING_UP: { color: 'purple', text: '🏪 Tài xế đang lấy hàng' },
                    DELIVERING: { color: 'blue', text: '🚚 Tài xế đang giao cho bạn' },
                    COMPLETED: { color: 'green', text: '✅ Đơn hàng đã hoàn thành' },
                    CANCELLED: { color: 'red', text: '❌ Đã hủy' },
                  };

                  return (
                    <Col xs={24} sm={12} key={order.id}>
                      <Card
                        hoverable
                        onClick={() => {
                          navigate(`/order/${order.id}`);
                          setTrackingModalOpen(false);
                        }}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: '1px solid #f0f0f0',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '';
                          e.currentTarget.style.transform = '';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                              Đơn hàng <span style={{ color: '#ff6b35' }}>#{order.id}</span>
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                              📅 {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <Tag color={statusColors[order.status]?.color} style={{ marginTop: '4px' }}>
                            {statusColors[order.status]?.text}
                          </Tag>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        <div style={{ marginBottom: '8px' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Cửa hàng</p>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#222' }}>
                            🏪 {order.store?.name || 'N/A'}
                          </p>
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Giao đến</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                            📍 {order.delivery_address || 'N/A'}
                          </p>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>Tổng tiền</p>
                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#ff7a00' }}>
                              {order.total_price?.toLocaleString()} đ
                            </p>
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            style={{ borderRadius: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/order/${order.id}`);
                              setTrackingModalOpen(false);
                            }}
                          >
                            Xem chi tiết →
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          ) : (
            <Empty
              description="Bạn chưa có đơn hàng nào"
              style={{ marginTop: '40px', marginBottom: '40px' }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Spin>
      </Modal>
    </Layout>
  );
}

function App() {
  const { token, user, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!token) return undefined;

    let isMounted = true;

    const syncCurrentUser = async () => {
      try {
        const currentUser = await apiClient.getCurrentUser();
        if (!isMounted) return;

        const hasChanged = !user
          || currentUser.id !== user.id
          || currentUser.role !== user.role
          || currentUser.username !== user.username
          || currentUser.phone !== user.phone
          || currentUser.image_url !== user.image_url;

        if (hasChanged) {
          setUser(currentUser);
        }
      } catch (error) {
        if (isMounted) {
          logout();
        }
      }
    };

    syncCurrentUser();
    const intervalId = window.setInterval(syncCurrentUser, 10000);
    window.addEventListener('focus', syncCurrentUser);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncCurrentUser);
    };
  }, [token, user?.id, user?.role, user?.username, user?.phone, user?.image_url, setUser, logout]);

  const appContent = (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
  );

  if (!GOOGLE_OAUTH_ENABLED) {
    return appContent;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {appContent}
    </GoogleOAuthProvider>
  );
}

export default App;
