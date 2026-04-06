import React, { useState } from 'react';
import {
  Button, Table, Space, Empty, Row, Col, Card, Divider, Typography,
  InputNumber, Tooltip, Modal, message, Collapse, Tag, Statistic,
} from 'antd';
import {
  DeleteOutlined, ShoppingCartOutlined, ArrowLeftOutlined,
  CheckCircleOutlined, ShoppingOutlined, CloseOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useStore';
import BootstrapIcon from '../components/BootstrapIcon';
import '../styles/CartPage.css';

const { Title, Text } = Typography;

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart } = useOrderStore();
  const [expandedStore, setExpandedStore] = useState(null);

  if (cart.length === 0) {
    return (
      <div className="cart-page-empty">
        <div className="empty-icon">
          <ShoppingOutlined />
        </div>
        <Title level={3}>Giỏ hàng trống</Title>
        <Text type="secondary">Hãy chọn những món yummy và thêm vào giỏ hàng!</Text>
        <Button
          type="primary"
          size="large"
          style={{ marginTop: 24, background: '#ff6b35' }}
          onClick={() => navigate('/stores')}
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  // Group items by store
  const groupedByStore = cart.reduce((acc, item) => {
    const storeId = item.storeId;
    if (!acc[storeId]) {
      acc[storeId] = {
        storeName: item.storeName || 'Quán ăn',
        items: [],
      };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {});

  const storeGroups = Object.entries(groupedByStore).map(([storeId, group]) => ({
    storeId,
    ...group,
  }));

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = 15000;
  const finalTotal = totalPrice + shippingFee;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (foodId, storeId) => {
    removeFromCart(foodId, storeId);
    message.success('Đã xóa khỏi giỏ hàng');
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/stores');
  };

  const handleClearCart = () => {
    Modal.confirm({
      title: 'Xóa giỏ hàng',
      content: 'Bạn có chắc muốn xóa tất cả sản phẩm?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk() {
        clearCart();
        message.success('Đã xóa giỏ hàng');
      },
    });
  };

  const storeItems = storeGroups.map((group) => ({
    key: group.storeId,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Space>
          <ShoppingCartOutlined style={{ color: '#ff6b35' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{group.storeName}</span>
          <Tag color="blue">{group.items.length} món</Tag>
        </Space>
        <span style={{ color: '#999', fontSize: 13 }}>
          {group.items.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}đ
        </span>
      </div>
    ),
    children: (
      <div className="store-items">
        {group.items.map((item) => (
          <div key={`${item.id}-${item.storeId}`} className="cart-item-row">
            <div className="cart-item-image">
              <img
                src={getImageSrc(item.image_url)}
                alt={item.name}
              />
            </div>
            <div className="cart-item-details">
              <div className="item-name">{item.name}</div>
              <div className="item-price">{item.price.toLocaleString()}đ</div>
            </div>
            <div className="cart-item-controls">
              <InputNumber
                min={1}
                max={99}
                value={item.quantity}
                onChange={(value) => updateQuantity(item.id, item.storeId, value)}
                style={{ width: 70 }}
              />
              <div className="item-subtotal">
                {(item.price * item.quantity).toLocaleString()}đ
              </div>
              <Tooltip title="Xóa">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(item.id, item.storeId)}
                />
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <div className="cart-page-container">
      {/* HEADER */}
      <div className="cart-page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShoppingCartOutlined style={{ color: '#ff6b35', fontSize: 28 }} />
          Giỏ hàng ({totalItems} món)
        </Title>
      </div>

      <Row gutter={24} className="cart-page-content">
        {/* LEFT: CART ITEMS */}
        <Col xs={24} md={14}>
          <Card
            className="cart-items-card"
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Chi tiết đơn hàng</span>
                <Button type="text" danger size="small" onClick={handleClearCart}>
                  <DeleteOutlined /> Xóa tất cả
                </Button>
              </div>
            }
          >
            {storeGroups.length > 0 ? (
              <Collapse
                items={storeItems}
                defaultActiveKey={storeGroups.map((g) => g.storeId)}
                accordion={false}
              />
            ) : (
              <Empty description="Không có sản phẩm" />
            )}
          </Card>

          {/* ACTIONS */}
          <div className="cart-page-actions">
            <Button
              block
              size="large"
              onClick={handleContinueShopping}
              style={{ marginBottom: 12 }}
            >
              <PlusOutlined /> Tiếp tục mua sắm
            </Button>
          </div>
        </Col>

        {/* RIGHT: SUMMARY */}
        <Col xs={24} md={10}>
          <Card className="cart-summary-card" title="Tóm tắt đơn hàng">
            {/* STATISTICS */}
            <div style={{ marginBottom: 20 }}>
              <Row gutter={12}>
                <Col xs={12}>
                  <Statistic
                    title="Số lượng"
                    value={totalItems}
                    suffix="món"
                    valueStyle={{ color: '#ff6b35' }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="Quán ăn"
                    value={storeGroups.length}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            </div>

            <Divider />

            {/* BREAKDOWN */}
            <div className="summary-breakdown">
              <div className="breakdown-row">
                <Text>Tạm tính:</Text>
                <Text strong>{totalPrice.toLocaleString()}đ</Text>
              </div>

              <div className="breakdown-row">
                <Text>Phí giao hàng:</Text>
                <Text strong>{shippingFee.toLocaleString()}đ</Text>
              </div>

              <div className="breakdown-row promotion">
                <Text type="success">
                  <BootstrapIcon icon="gift" size={14} /> Khuyến mãi:
                </Text>
                <Text type="success">-0đ</Text>
              </div>
            </div>

            <Divider />

            {/* TOTAL */}
            <div className="summary-total">
              <div>
                <Text style={{ fontSize: 14 }}>Tổng cộng</Text>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ff6b35' }}>
                {finalTotal.toLocaleString()}đ
              </div>
            </div>

            {/* INFO BOX */}
            <div className="info-box">
              <div style={{ marginBottom: 12 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text type="success">Giao hàng nhanh 30 phút</Text>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text type="success">Thanh toán khi nhận</Text>
              </div>
            </div>

            {/* CHECKOUT BUTTON */}
            <Button
              block
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleCheckout}
              style={{
                marginTop: 24,
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7a86e 100%)',
                border: 'none',
                fontWeight: 600,
                height: 48,
                fontSize: 16,
              }}
            >
              Thanh toán
            </Button>

            {/* CONTINUE SHOPPING LINK */}
            <Button
              block
              type="link"
              size="large"
              onClick={handleContinueShopping}
              style={{ marginTop: 12, color: '#1890ff' }}
            >
              ← Tiếp tục mua sắm
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CartPage;
