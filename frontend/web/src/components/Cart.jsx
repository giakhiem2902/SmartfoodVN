import React from 'react';
import { Drawer, Table, Button, Space, Empty, Image, InputNumber, message, Tooltip, Divider } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useOrderStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import BootstrapIcon from './BootstrapIcon';
import '../styles/Cart.css';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const Cart = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart } = useOrderStore();
  
  const getImageSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống');
      return;
    }
    onClose();
    navigate('/checkout');
  };

  const columns = [
    {
      title: '',
      key: 'image',
      width: 60,
      render: (_, record) => (
        <Image
          src={getImageSrc(record.image_url)}
          alt={record.name}
          width={50}
          height={50}
          style={{ borderRadius: 8, objectFit: 'cover' }}
          preview={false}
        />
      ),
    },
    {
      title: 'Tên món',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text, record) => (
        <div style={{ maxWidth: 150 }}>
          <p style={{ margin: 0, fontWeight: 500, whiteSpace: 'normal' }}>{text}</p>
          <small style={{ color: '#999' }}>{record.storeName}</small>
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (price) => <span style={{ fontWeight: 600, color: '#ff6b35' }}>{price.toLocaleString()}đ</span>,
    },
    {
      title: 'S/L',
      key: 'quantity',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={1}
          max={99}
          value={record.quantity}
          onChange={(value) => updateQuantity(record.id, record.storeId, value)}
          style={{ width: 60 }}
        />
      ),
    },
    {
      title: 'Thành tiền',
      key: 'total',
      width: 100,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>
          {(record.price * record.quantity).toLocaleString()}đ
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Tooltip title="Xóa">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              removeFromCart(record.id, record.storeId);
              message.success('Đã xóa khỏi giỏ hàng');
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCartOutlined style={{ fontSize: 20 }} />
          <span>Giỏ hàng ({totalItems} món)</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={800}
      styles={{ body: { padding: '16px' } }}
      footer={
        cart.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              block
              onClick={() => {
                onClose();
                navigate('/cart');
              }}
            >
              Xem giỏ hàng
            </Button>
            <Button
              block
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleCheckout}
              style={{ 
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7a86e 100%)',
                border: 'none',
                fontWeight: 600
              }}
            >
              Thanh toán ({totalPrice.toLocaleString()}đ)
            </Button>
          </div>
        )
      }
    >
      {cart.length === 0 ? (
        <Empty
          description="Giỏ hàng trống"
          style={{ marginTop: 80 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={cart}
            rowKey={(record) => `${record.id}-${record.storeId}`}
            pagination={false}
            size="small"
            bordered
          />

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
            <div>
              <p style={{ margin: 0, color: '#999' }}>Tạm tính:</p>
              <p style={{ margin: 0, color: '#999' }}>Phí giao:</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 16, fontWeight: 700, color: '#ff6b35' }}>
                Tổng cộng:
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                {totalPrice.toLocaleString()}đ
              </p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>15.000đ</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 18, fontWeight: 700, color: '#ff6b35' }}>
                {(totalPrice + 15000).toLocaleString()}đ
              </p>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default Cart;
