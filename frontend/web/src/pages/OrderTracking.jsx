import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Divider, Spin, message } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
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
      const response = await apiClient.getOrder(token, orderId);
      if (response.success) {
        setOrder(response.data);
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
      <h1>📍 Order Tracking - #{order.id}</h1>

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <h3>Order Status</h3>
          <Tag color={statusColors[order.status]} style={{ fontSize: '14px', padding: '5px 10px' }}>
            {order.status}
          </Tag>
        </div>

        <Divider />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <div>
            <h4>📦 Order Details</h4>
            <p>
              <strong>Total Price:</strong> {order.total_price.toLocaleString()} đ
            </p>
            <p>
              <strong>Food Price:</strong> {order.total_food_price.toLocaleString()} đ
            </p>
            <p>
              <strong>Shipping Fee:</strong> {order.shipping_fee.toLocaleString()} đ
            </p>
            <p>
              <strong>Distance:</strong> {order.distance_km.toFixed(1)} km
            </p>
          </div>

          <div>
            <h4>👤 Delivery Info</h4>
            <p>
              <EnvironmentOutlined /> {order.delivery_address}
            </p>
            {order.driver && (
              <div>
                <p>
                  <strong>Driver:</strong> {order.driver.username}
                </p>
                <p>
                  <PhoneOutlined /> {order.driver.phone}
                </p>
              </div>
            )}
          </div>
        </div>

        <Divider />

        <h4>📋 Items</h4>
        {order.items && order.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>
              {item.food.name} x {item.quantity}
            </span>
            <span>{(item.price * item.quantity).toLocaleString()} đ</span>
          </div>
        ))}
      </Card>

      {/* Map */}
      <Card title="Live Tracking Map" style={{ marginBottom: '20px' }}>
        <TrackingMap
          driverPos={driverLocation}
          storePos={{ lat: order.store.lat, lng: order.store.lng, name: order.store.name }}
          userPos={{ lat: order.delivery_lat, lng: order.delivery_lng }}
        />
      </Card>

      {/* Timeline */}
      <Card title="Order Timeline">
        <div style={{ fontSize: '12px' }}>
          <p>✅ Created at: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
          {order.completed_at && (
            <p>✅ Completed at: {new Date(order.completed_at).toLocaleString('vi-VN')}</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OrderTracking;
