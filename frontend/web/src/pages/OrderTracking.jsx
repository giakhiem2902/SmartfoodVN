import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Divider, Spin, message, Timeline } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, CheckCircleOutlined, TruckOutlined, ShoppingOutlined, HomeOutlined } from '@ant-design/icons';
import TrackingMap from '../components/TrackingMap';
import socketService from '../services/socketService';
import apiClient from '../services/apiClient';
import { useParams } from 'react-router-dom';

const OrderTracking = ({ token }) => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    fetchOrder();
    socketService.connect();
  }, [orderId, token]);

  useEffect(() => {
    if (order) {
      socketService.joinOrder(orderId, order.user_id);

      // Listen for driver location updates
      socketService.onDriverLocation((data) => {
        if (data.orderId === parseInt(orderId)) {
          setDriverLocation({ lat: data.lat, lng: data.lng });
        }
      });

      // Listen for order status changes
      socketService.onOrderStatusChanged((data) => {
        if (data.orderId === parseInt(orderId)) {
          setOrder((prev) => ({ ...prev, status: data.status }));
          message.success(`Order status: ${data.status}`);
        }
      });

      return () => {
        socketService.leaveOrder(orderId);
      };
    }
  }, [order, orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getOrder(orderId);
      // Response is already unwrapped by apiClient
      if (response && response.id) {
        setOrder(response);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      message.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }} />;
  }

  if (!order) {
    return <p>Order not found</p>;
  }

  const statusColors = {
    PENDING: 'orange',
    CONFIRMED: 'blue',
    FINDING_DRIVER: 'cyan',
    DRIVER_ACCEPTED: 'green',
    DELIVERING: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'red',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <EnvironmentOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
        Theo dõi đơn hàng #{order.id}
      </h1>

      <Card style={{ marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircleOutlined /> Trạng thái đơn hàng
          </h3>
          <Tag color={statusColors[order.status]} style={{ fontSize: '14px', padding: '5px 10px' }}>
            {order.status === 'PENDING' && '⏳ Chờ xác nhận'}
            {order.status === 'CONFIRMED' && '✅ Đã xác nhận'}
            {order.status === 'FINDING_DRIVER' && '🔍 Đang tìm tài xế'}
            {order.status === 'DRIVER_ACCEPTED' && '🤝 Tài xế đã nhận'}
            {order.status === 'DELIVERING' && '🚚 Đang giao hàng'}
            {order.status === 'COMPLETED' && '✨ Đã hoàn thành'}
            {order.status === 'CANCELLED' && '❌ Đã hủy'}
          </Tag>
        </div>

        <Divider />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingOutlined style={{ fontSize: '18px', color: '#ff7a00' }} />
              Chi tiết đơn hàng
            </h4>
            <div style={{ marginLeft: '28px' }}>
              <p>
                <strong>Tổng tiền:</strong> {order.total_price.toLocaleString()} đ
              </p>
              <p>
                <strong>Tiền hàng:</strong> {order.total_food_price.toLocaleString()} đ
              </p>
              <p>
                <strong>Phí giao:</strong> {order.shipping_fee.toLocaleString()} đ
              </p>
              <p>
                <strong>Quãng đường:</strong> {parseFloat(order.distance_km).toFixed(1)} km
              </p>
            </div>
          </div>

          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HomeOutlined style={{ fontSize: '18px', color: '#13c2c2' }} />
              Thông tin giao hàng
            </h4>
            <div style={{ marginLeft: '28px' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EnvironmentOutlined /> {order.delivery_address}
              </p>
              {order.driver && (
                <>
                  <p style={{ marginTop: '10px' }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TruckOutlined style={{ fontSize: '16px' }} /> Tài xế
                    </strong>
                  </p>
                  <p style={{ marginLeft: '26px', marginTop: '5px' }}>
                    {order.driver.username}
                  </p>
                  <p style={{ marginLeft: '26px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PhoneOutlined style={{ fontSize: '14px' }} /> {order.driver.phone}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <Divider />

        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingOutlined style={{ fontSize: '18px', color: '#ff7a00' }} />
            🏪 Thông tin cửa hàng
          </h4>
          <div style={{ marginLeft: '28px', backgroundColor: '#fafafa', padding: '12px', borderRadius: '4px' }}>
            {order.store ? (
              <>
                <p style={{ marginBottom: '8px' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {order.store.name}
                  </strong>
                </p>
                <p style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EnvironmentOutlined style={{ fontSize: '14px', color: '#ff7a00' }} />
                  {order.store.address}
                </p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneOutlined style={{ fontSize: '14px', color: '#1890ff' }} />
                  {order.store.phone}
                </p>
              </>
            ) : (
              <p style={{ color: '#999' }}>Thông tin cửa hàng không khả dụng</p>
            )}
          </div>
        </div>

        <Divider />

        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          Danh sách hàng hóa
        </h4>
        <div style={{ marginLeft: '28px', backgroundColor: '#fafafa', padding: '12px', borderRadius: '4px' }}>
          {order.items && order.items.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: index !== order.items.length - 1 ? '1px solid #eee' : 'none' }}>
              <span>
                {item.food.name} x {item.quantity}
              </span>
              <span style={{ fontWeight: '600' }}>{(item.price * item.quantity).toLocaleString()} đ</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Map */}
      <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><EnvironmentOutlined style={{ color: '#1890ff' }} />Bản đồ theo dõi</span>} style={{ marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <TrackingMap
          driverPos={driverLocation}
          storePos={{ lat: order.store.lat, lng: order.store.lng, name: order.store.name }}
          userPos={{ lat: order.delivery_lat, lng: order.delivery_lng }}
        />
      </Card>

      {/* Timeline */}
      <Card title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ClockCircleOutlined style={{ color: '#1890ff' }} />Lịch sử đơn hàng</span>} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Timeline
          items={[
            {
              children: <span>Đơn hàng được tạo lúc <strong>{new Date(order.created_at).toLocaleString('vi-VN')}</strong></span>,
              dot: <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />,
            },
            order.completed_at && {
              children: <span>Đơn hàng được hoàn thành lúc <strong>{new Date(order.completed_at).toLocaleString('vi-VN')}</strong></span>,
              dot: <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />,
            },
          ].filter(Boolean)}
        />
      </Card>
    </div>
  );
};

export default OrderTracking;
