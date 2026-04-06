import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Divider, Spin, message, Timeline, Row, Col, Typography, Space, Badge, Empty } from 'antd';
import {
  EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, CheckCircleOutlined,
  TruckOutlined, ShoppingOutlined, HomeOutlined, ArrowLeftOutlined, CopyOutlined
} from '@ant-design/icons';
import TrackingMap from '../components/TrackingMap';
import socketService from '../services/socketService';
import apiClient from '../services/apiClient';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const OrderTracking = ({ token }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
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
          message.success(`Trạng thái đơn hàng: ${data.status}`);
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
      message.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <Empty description="Không tìm thấy đơn hàng" />
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  const statusConfig = {
    PENDING: { color: 'orange', text: '⏳ Chờ xác nhận', progress: 1 },
    CONFIRMED: { color: 'blue', text: '✅ Đã xác nhận', progress: 2 },
    FINDING_DRIVER: { color: 'cyan', text: '🔍 Tìm tài xế', progress: 3 },
    DRIVER_ACCEPTED: { color: 'green', text: '🤝 Tài xế đã nhận', progress: 4 },
    DELIVERING: { color: 'blue', text: '🚚 Đang giao hàng', progress: 5 },
    COMPLETED: { color: 'green', text: '✨ Đã hoàn thành', progress: 6 },
    CANCELLED: { color: 'red', text: '❌ Đã hủy', progress: 0 },
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép');
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '20px 0' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderBottom: '1px solid #f0f0f0', marginBottom: '20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              style={{ fontSize: '18px' }}
            />
            <Typography.Title level={2} style={{ margin: 0 }}>
              Theo dõi đơn hàng
            </Typography.Title>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <Row gutter={[24, 24]}>
          {/* Left Column - Order Information */}
          <Col xs={24} lg={12}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Order Details Card */}
              <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>📋</span>
                  <Typography.Title level={4} style={{ margin: 0 }}>Chi tiết đơn hàng</Typography.Title>
                </div>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text type="secondary">Mã đơn hàng</Typography.Text>
                    <Space size="small">
                      <Typography.Text copyable strong>{order.id}</Typography.Text>
                    </Space>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  
                  <div>
                    <Typography.Text type="secondary">Trạng thái</Typography.Text>
                    <div style={{ marginTop: '6px' }}>
                      <Tag color={statusConfig[order.status]?.color} style={{ fontSize: '13px' }}>
                        {statusConfig[order.status]?.text || order.status}
                      </Tag>
                    </div>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />

                  <div>
                    <Typography.Text type="secondary">Tổng cộng</Typography.Text>
                    <Typography.Title level={4} style={{ margin: '6px 0 0 0', color: '#ff7a00' }}>
                      ₫{(order.total_price || 0).toLocaleString('vi-VN')}
                    </Typography.Title>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />

                  <div>
                    <Typography.Text type="secondary">Chi tiết giá</Typography.Text>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tiền hàng:</span>
                        <span>₫{(order.total_food_price || 0).toLocaleString('vi-VN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Phí giao:</span>
                        <span>₫{(order.shipping_fee || 0).toLocaleString('vi-VN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Quãng đường:</span>
                        <span>{parseFloat(order.distance_km).toFixed(1)} km</span>
                      </div>
                    </div>
                  </div>
                </Space>
              </Card>

              {/* Store Information Card */}
              <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>🏪</span>
                  <Typography.Title level={4} style={{ margin: 0 }}>Cửa hàng</Typography.Title>
                </div>
                {order.store ? (
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Typography.Text strong>{order.store.name}</Typography.Text>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Typography.Text type="secondary">Địa chỉ</Typography.Text>
                      <Typography.Paragraph style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
                        {order.store.address}
                      </Typography.Paragraph>
                    </div>
                    {order.store.phone && (
                      <>
                        <Divider style={{ margin: '8px 0' }} />
                        <div>
                          <Typography.Text type="secondary">Điện thoại</Typography.Text>
                          <Typography.Paragraph style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
                            {order.store.phone}
                          </Typography.Paragraph>
                        </div>
                      </>
                    )}
                  </Space>
                ) : (
                  <Typography.Text type="secondary">Không có thông tin</Typography.Text>
                )}
              </Card>

              {/* Delivery Address Card */}
              <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>📍</span>
                  <Typography.Title level={4} style={{ margin: 0 }}>Địa chỉ giao hàng</Typography.Title>
                </div>
                <Typography.Paragraph style={{ margin: 0, fontSize: '13px' }}>
                  {order.delivery_address}
                </Typography.Paragraph>
              </Card>

              {/* Driver Information Card */}
              {(order.driver || order.status !== 'PENDING') && (
                <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px' }}>🚚</span>
                    <Typography.Title level={4} style={{ margin: 0 }}>Tài xế</Typography.Title>
                  </div>
                  {order.driver ? (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Typography.Text strong>{order.driver.username}</Typography.Text>
                      <Divider style={{ margin: '8px 0' }} />
                      <div>
                        <Typography.Text type="secondary">Điện thoại</Typography.Text>
                        <Typography.Paragraph style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
                          {order.driver.phone}
                        </Typography.Paragraph>
                      </div>
                    </Space>
                  ) : (
                    <Typography.Text type="secondary">Đang tìm tài xế...</Typography.Text>
                  )}
                </Card>
              )}
            </Space>
          </Col>

          {/* Right Column - Map and Items */}
          <Col xs={24} lg={12}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Map Card */}
              <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>🗺️</span>
                  <Typography.Title level={4} style={{ margin: 0 }}>Bản đồ</Typography.Title>
                </div>
                <div style={{ height: '450px', borderRadius: '6px', overflow: 'hidden' }}>
                  <TrackingMap
                    driverPos={driverLocation}
                    storePos={{ lat: order.store.lat, lng: order.store.lng, name: order.store.name }}
                    userPos={{ lat: order.delivery_lat, lng: order.delivery_lng }}
                  />
                </div>
              </Card>

              {/* Items Card */}
              <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>📦</span>
                  <Typography.Title level={4} style={{ margin: 0 }}>Danh sách hàng hóa</Typography.Title>
                </div>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        style={{
                          padding: '12px',
                          backgroundColor: '#fafafa',
                          borderRadius: '6px',
                          border: '1px solid #f0f0f0',
                          display: 'flex',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <Typography.Text strong style={{ fontSize: '13px' }}>
                                {item.food?.name || item.name}
                              </Typography.Text>
                              <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                                Số lượng: {item.quantity}
                              </div>
                            </div>
                            <Typography.Text strong style={{ color: '#ff7a00', fontSize: '13px' }}>
                              ₫{((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}
                            </Typography.Text>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Typography.Text type="secondary">Không có hàng hóa</Typography.Text>
                  )}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>

        {/* Timeline Card - Full Width */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '20px' }}>⏱️</span>
                <Typography.Title level={4} style={{ margin: 0 }}>Lịch sử đơn hàng</Typography.Title>
              </div>
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
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default OrderTracking;
