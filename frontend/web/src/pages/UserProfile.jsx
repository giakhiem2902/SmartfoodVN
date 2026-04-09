import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Input, Avatar, Spin, message, Space, Divider, Row, Col, Statistic, Tag, Upload, Modal } from 'antd';
import { UserOutlined, CameraOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useStore';
import apiClient from '../services/apiClient';
import LocationPicker from '../components/LocationPicker';

const UserProfile = () => {
  const { user, setUser } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState('');

  useEffect(() => {
    setMounted(true);
    // Fetch user info từ API nếu chưa có
    if (!user) {
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Lấy user info từ backend
      const response = await apiClient.getCurrentUser();
      if (response) {
        setUser(response);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (user && mounted) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
      });
      // Load user location
      if (user.lat && user.lng) {
        setUserLocation({ lat: user.lat, lng: user.lng });
        getAddressFromCoords(user.lat, user.lng);
      }
      fetchStats();
    }
  }, [user, form, mounted]);

  const fetchStats = async () => {
    try {
      // Lấy thông tin thống kê từ API (nếu có)
      const response = await apiClient.getUserOrders();
      if (response && Array.isArray(response)) {
        const totalOrders = response.length;
        const completedOrders = response.filter(o => o.status === 'COMPLETED').length;
        const totalSpent = response.reduce((sum, o) => {
          const price = parseFloat(o.total_price) || 0;
          return sum + price;
        }, 0);
        
        setStats({
          totalOrders,
          completedOrders,
          totalSpent: Math.round(totalSpent),
          joinDate: user?.created_at,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback stats
      setStats({
        totalOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        joinDate: user?.created_at,
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // Gọi API cập nhật profile
      const response = await apiClient.updateProfile(values);
      if (response) {
        setUser(response);
        message.success('Cập nhật thông tin thành công!');
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      setUploading(true);
      // TODO: Upload avatar to server
      message.success('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      message.error('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  // Reverse geocode để lấy địa chỉ từ tọa độ
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`,
        { headers: { 'User-Agent': 'SmartFood-App' } }
      );
      
      if (!response.ok) throw new Error('Nominatim error');
      
      const data = await response.json();
      const address = data.address || {};
      let addressParts = [];
      
      if (address.road) addressParts.push(address.road);
      else if (address.pedestrian) addressParts.push(address.pedestrian);
      
      if (address.suburb) addressParts.push(address.suburb);
      else if (address.district) addressParts.push(address.district);
      
      if (address.city) addressParts.push(address.city);
      
      const addressStr = addressParts.filter(Boolean).join(', ');
      setUserAddress(addressStr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (err) {
      console.error('Geocoding error:', err);
      setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleLocationSelect = async (location, address) => {
    try {
      setLoading(true);
      // Call API to update user location
      const response = await apiClient.updateLocation(location.lat, location.lng);
      if (response) {
        setUserLocation(location);
        setUserAddress(address);
        setUser(response);
        message.success('Cập nhật vị trí giao hàng thành công!');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      message.error('Cập nhật vị trí thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !mounted) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px', color: '#999' }}>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <UserOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
        Thông tin cá nhân
      </h1>

      {/* Avatar Section */}
      <Card style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }}>
          <Avatar
            src={user?.image_url}
            icon={!user?.image_url && <UserOutlined />}
            style={{ background: '#ff6b35', marginRight: '10px' }}
            size={120}
          />
          <br />
          <Upload
            beforeUpload={(file) => {
              handleAvatarUpload(file);
              return false;
            }}
            showUploadList={false}
            accept="image/*"
          >
            <Button
              icon={<CameraOutlined />}
              loading={uploading}
              style={{ marginTop: '10px' }}
            >
              Thay đổi ảnh đại diện
            </Button>
          </Upload>
        </div>
        <h2>{user?.username}</h2>
        <Tag color={user?.role === 'admin' ? 'red' : user?.role === 'store' ? 'gold' : user?.role === 'driver' ? 'green' : 'blue'}>
          {user?.role === 'admin'
            ? 'Quản trị viên'
            : user?.role === 'store'
              ? 'Chủ cửa hàng'
              : user?.role === 'driver'
                ? 'Tài xế'
                : 'Khách hàng'}
        </Tag>
      </Card>

      {/* Statistics Section */}
      {stats && (
        <Card style={{ marginBottom: '30px' }}>
          <Row gutter={24}>
            <Col xs={24} sm={6}>
              <Statistic
                title="Tổng đơn hàng"
                value={stats.totalOrders}
                prefix="📦"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Đơn hoàn thành"
                value={stats.completedOrders}
                prefix="✅"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Tổng chi tiêu"
                value={stats.totalSpent}
                suffix="đ"
                prefix="💰"
                valueStyle={{ color: '#ff7a00' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Ngày tham gia"
                value={stats.joinDate ? new Date(stats.joinDate).toLocaleDateString('vi-VN') : 'N/A'}
                prefix="📅"
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Profile Information Section */}
      <Card
        title="Thông tin tài khoản"
        extra={
          <Button
            type={editing ? 'default' : 'primary'}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </Button>
        }
        style={{ marginBottom: '30px' }}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={!editing}
          onFinish={handleSubmit}
        >
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tên đăng nhập"
                name="username"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                tooltip={user?.google_id ? '🔒 Quản lý bởi Google - không thể thay đổi' : ''}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  disabled={user?.google_id || !editing}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
                tooltip={user?.google_id ? '🔒 Quản lý bởi Google - không thể thay đổi' : ''}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  type="email"
                  disabled={user?.google_id || !editing}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
              >
                <Input prefix={<PhoneOutlined />} type="tel" />
              </Form.Item>
            </Col>
          </Row>

          {editing && (
            <Row gutter={24}>
              <Col xs={24}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                  >
                    Lưu thay đổi
                  </Button>
                  <Button onClick={() => setEditing(false)}>
                    Hủy
                  </Button>
                </Space>
              </Col>
            </Row>
          )}
        </Form>
      </Card>

      {/* Delivery Location Section */}
      <Card 
        title={<span><EnvironmentOutlined style={{ marginRight: 8 }} />Vị trí giao hàng</span>}
        extra={
          <Button 
            type="primary" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => setLocationPickerOpen(true)}
            style={{ background: '#ff6b35' }}
          >
            Thay đổi
          </Button>
        }
        style={{ marginBottom: '30px' }}
      >
        {userLocation ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px', fontWeight: 500 }}>
                📍 Địa chỉ
              </p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#333' }}>
                {userAddress}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '32px', fontSize: '12px', color: '#666' }}>
              <span>
                🌐 Kinh độ: <strong style={{ color: '#1890ff' }}>{userLocation.lng.toFixed(5)}</strong>
              </span>
              <span>
                🌐 Vĩ độ: <strong style={{ color: '#1890ff' }}>{userLocation.lat.toFixed(5)}</strong>
              </span>
            </div>
          </Space>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ color: '#999', marginBottom: '12px' }}>
              Chưa có vị trí giao hàng mặc định
            </p>
            <Button 
              type="primary" 
              size="small"
              icon={<EnvironmentOutlined />}
              onClick={() => setLocationPickerOpen(true)}
              style={{ background: '#ff6b35' }}
            >
              Thêm vị trí giao hàng
            </Button>
          </div>
        )}
      </Card>

      {/* Additional Information */}
      <Card title="Thông tin bổ sung">
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '10px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>
                <CalendarOutlined /> Ngày tạo tài khoản
              </p>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
              </p>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '10px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>
                🔒 Trạng thái bảo mật 2 lớp
              </p>
              <Tag color={user?.two_factor_enabled ? 'green' : 'red'}>
                {user?.two_factor_enabled ? '✅ Đã bật' : '❌ Chưa bật'}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* Quick Links */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Các tùy chọn khác</h3>
        <Space wrap>
          <Button type="default" href="/security" style={{ textDecoration: 'none' }}>
            🔐 Bảo mật 2 lớp
          </Button>
          <Button type="default" href="/orders" style={{ textDecoration: 'none' }}>
            📦 Đơn hàng của tôi
          </Button>
          <Button type="default" href="/" style={{ textDecoration: 'none' }}>
            🏠 Trang chủ
          </Button>
        </Space>
      </div>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onConfirm={handleLocationSelect}
        initialLocation={userLocation}
        initialAddress={userAddress}
      />
    </div>
  );
};

export default UserProfile;
