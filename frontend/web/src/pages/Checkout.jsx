import React, { useState } from 'react';
import {
  Page, Button, Form, Input, Select, Row, Col, Card, Table, Divider,
  Spin, message, Space, Typography, Radio, Image, Empty,
} from 'antd';
import {
  HomeOutlined, PhoneOutlined, UserOutlined, CreditCardOutlined,
  ArrowLeftOutlined, CheckCircleOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrderStore, useAuthStore, useLocationStore } from '../store/useStore';
import LocationPicker from '../components/LocationPicker';
import apiClient from '../services/apiClient';
import '../styles/Checkout.css';

const { Title, Text } = Typography;

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useOrderStore();
  const { user } = useAuthStore();
  const { userAddress } = useLocationStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, card, wallet
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(userAddress || '');

  if (cart.length === 0 && !orderConfirmed) {
    return (
      <div className="checkout-empty">
        <Empty description="Giỏ hàng trống" />
        <Button 
          type="primary" 
          onClick={() => navigate('/stores')}
          style={{ marginTop: 20, background: '#ff6b35' }}
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  if (orderConfirmed) {
    return (
      <div className="checkout-success">
        <div className="success-icon">
          <CheckCircleOutlined style={{ fontSize: 80, color: '#52c41a' }} />
        </div>
        <Title level={2}>Đặt hàng thành công!</Title>
        <p>Đơn hàng #{orderId}</p>
        <p style={{ color: '#999' }}>Chúng tôi sẽ sớm liên hệ để xác nhận</p>
        <Space style={{ marginTop: 24 }}>
          <Button 
            onClick={() => navigate(`/order/${orderId}`)}
            type="primary"
            style={{ background: '#ff6b35' }}
          >
            Xem đơn hàng
          </Button>
          <Button onClick={() => navigate('/stores')}>
            Quay lại
          </Button>
        </Space>
      </div>
    );
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = 15000;
  const finalTotal = totalPrice + shippingFee;

  const handleLocationSelect = (location, address) => {
    setSelectedLocation(location);
    setSelectedAddress(address);
    setSelectedCoords({
      lat: location.lat,
      lng: location.lng,
    });
    form.setFieldValue('address', address);
    message.success('Đã cập nhật vị trí giao hàng');
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Get storeId from first item in cart (all items should be from same store)
      let storeId = cart.length > 0 ? cart[0].storeId : null;
      console.log('Cart items:', cart);
      console.log('StoreId extracted:', storeId);
      
      // Fallback: if storeId is undefined/null, try to extract from any item or use first item's store
      if (!storeId && cart.length > 0) {
        // Try to get storeId from store info if available
        storeId = cart[0].store_id || cart[0].storeId;
      }
      
      if (!storeId) {
        const errorMsg = `❌ Lỗi: Giỏ hàng không có thông tin cửa hàng. 
        
✅ Giải pháp: 
1. Nhấn "Xóa hết" để xóa giỏ hàng cũ
2. Quay lại chọn sản phẩm từ cửa hàng
3. Sau đó tiến hành thanh toán lại`;
        message.error(errorMsg);
        console.warn('Corrupted cart items (missing storeId):', cart);
        setLoading(false);
        return;
      }

      // Validate delivery coordinates
      if (!selectedCoords) {
        message.error('Vui lòng chọn vị trí giao hàng trên bản đồ');
        return;
      }

      const orderData = {
        storeId,
        deliveryLat: selectedCoords.lat,
        deliveryLng: selectedCoords.lng,
        deliveryAddress: selectedAddress || values.address,
        paymentMethod: paymentMethod === 'cod' ? 'CASH' : paymentMethod === 'card' ? 'CARD' : 'WALLET',
        items: cart.map(item => ({
          food_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        notes: values.note,
      };

      console.log('=== CHECKOUT PAYLOAD ===');
      console.log('Order data being sent:', orderData);
      console.log('StoreId in payload:', orderData.storeId, 'Type:', typeof orderData.storeId);

      // Gọi API tạo đơn hàng
      const response = await apiClient.checkout(orderData);
      
      const newOrderId = response?.id || 'unknown';
      setOrderId(newOrderId);
      setOrderConfirmed(true);
      clearCart();
      message.success('Đặt hàng thành công! Đang chuyển hướng...');
      
      // Redirect to order tracking page after 1.5 seconds
      setTimeout(() => {
        navigate(`/order/${newOrderId}`);
      }, 1500);
    } catch (err) {
      console.error('Order error:', err);
      message.error('Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Món',
      key: 'name',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Image
            src={getImageSrc(record.image_url)}
            alt={record.name}
            width={40}
            height={40}
            style={{ borderRadius: 4, objectFit: 'cover' }}
            preview={false}
          />
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>{record.name}</p>
            <small style={{ color: '#999' }}>x{record.quantity}</small>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá',
      key: 'price',
      width: 100,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#ff6b35' }}>
          {(record.price * record.quantity).toLocaleString()}đ
        </span>
      ),
    },
  ];

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <Title level={2} style={{ margin: 0 }}>Thanh toán</Title>
      </div>

      <Row gutter={24} className="checkout-content">
        {/* LEFT: FORM */}
        <Col xs={24} md={14}>
          <Card title="Thông tin giao hàng" className="checkout-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                name: user?.username || '',
                phone: user?.phone_number || '',
                address: userAddress || '',
              }}
            >
              <Form.Item
                label="Tên người nhận"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nhập tên của bạn" />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="0987654321" />
              </Form.Item>

              <Form.Item
                label="Địa chỉ giao hàng"
                name="address"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input.TextArea 
                    prefix={<HomeOutlined />}
                    rows={3}
                    placeholder="Số nhà, đường, phường/quận, thành phố"
                    value={selectedAddress || form.getFieldValue('address')}
                    onChange={(e) => form.setFieldValue('address', e.target.value)}
                  />
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  block
                  type="dashed"
                  icon={<EnvironmentOutlined />}
                  onClick={() => setLocationPickerOpen(true)}
                  style={{ marginBottom: 16, color: '#ff6b35', borderColor: '#ff6b35' }}
                >
                  Chọn vị trí trên bản đồ
                </Button>
              </Form.Item>

              <Divider />

              <div style={{ marginBottom: 16 }}>
                <Text strong>Phương thức thanh toán</Text>
                <Radio.Group 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  value={paymentMethod}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}
                >
                  <Radio value="cod">
                    <Space>
                      <CreditCardOutlined />
                      <span>Thanh toán khi nhận hàng (COD)</span>
                    </Space>
                  </Radio>
                  <Radio value="card">
                    <Space>
                      <CreditCardOutlined />
                      <span>Thẻ tín dụng / Debit</span>
                    </Space>
                  </Radio>
                  <Radio value="wallet">
                    <Space>
                      <CreditCardOutlined />
                      <span>Ví điện tử</span>
                    </Space>
                  </Radio>
                </Radio.Group>
              </div>

              <Form.Item
                label="Ghi chú đơn hàng"
                name="note"
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="Thêm ghi chú cho cửa hàng (ví dụ: không cay, không hành...)"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  htmlType="submit" 
                  type="primary" 
                  block 
                  size="large"
                  loading={loading}
                  style={{ 
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7a86e 100%)',
                    border: 'none',
                    fontWeight: 600,
                    height: 44,
                  }}
                >
                  Đặt hàng
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* RIGHT: SUMMARY */}
        <Col xs={24} md={10}>
          <Card title="Tóm tắt đơn hàng" className="checkout-card checkout-summary">
            <Table
              columns={columns}
              dataSource={cart}
              rowKey={(record) => `${record.id}-${record.storeId}`}
              pagination={false}
              size="small"
              bordered={false}
            />

            <Divider />

            <div className="summary-row">
              <Text>Tạm tính:</Text>
              <Text strong>{totalPrice.toLocaleString()}đ</Text>
            </div>
            <div className="summary-row">
              <Text>Phí giao hàng:</Text>
              <Text strong>{shippingFee.toLocaleString()}đ</Text>
            </div>

            <Divider />

            <div className="summary-row total">
              <Text strong style={{ fontSize: 16 }}>Tổng cộng:</Text>
              <Text strong style={{ fontSize: 18, color: '#ff6b35' }}>
                {finalTotal.toLocaleString()}đ
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onConfirm={handleLocationSelect}
        initialLocation={selectedLocation}
        initialAddress={selectedAddress}
      />
    </div>
  );
};

export default Checkout;
