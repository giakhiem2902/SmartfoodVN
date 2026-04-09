import React, { useCallback, useEffect, useState } from 'react';
import {
  Card, Table, Button, Tag, Spin, message, Empty, Space, Modal, Typography, Divider, Image
} from 'antd';
import {
  EyeOutlined, DeleteOutlined, PhoneOutlined, ClockCircleOutlined,
  DollarOutlined, EnvironmentOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import '../styles/OrderHistory.css';

const { Text, Title } = Typography;
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await apiClient.getUserOrders();
      // Response is already unwrapped array by apiClient
      setOrders(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!silent) {
        message.error('Không thể tải lịch sử đơn hàng');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const intervalId = window.setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [fetchOrders]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsVisible(true);
  };

  const handleTrack = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const statusColors = {
    PENDING: 'orange',
    CONFIRMED: 'blue',
    FINDING_DRIVER: 'cyan',
    DRIVER_ACCEPTED: 'green',
    PICKING_UP: 'purple',
    DELIVERING: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'red',
  };

  const statusTexts = {
    PENDING: 'Đợi cửa hàng xác nhận',
    CONFIRMED: 'Quán đang làm món cho bạn',
    FINDING_DRIVER: 'Quán đang tìm tài xế',
    DRIVER_ACCEPTED: 'Tài xế đã nhận đơn',
    PICKING_UP: 'Tài xế đang lấy hàng tại quán',
    DELIVERING: 'Tài xế đang giao cho bạn',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 50,
    },
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => `#${id}`,
    },
    {
      title: 'Cửa hàng',
      dataIndex: 'store',
      key: 'store',
      render: (store) => store?.name || 'N/A',
      width: 150,
    },
    {
      title: 'Địa chỉ giao',
      dataIndex: 'delivery_address',
      key: 'delivery_address',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_price',
      key: 'total_price',
      align: 'right',
      width: 120,
      render: (price) => `${price?.toLocaleString()}đ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={statusColors[status]}>
          {statusTexts[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            title="Xem chi tiết"
          >
            Chi tiết
          </Button>
          {['PENDING', 'CONFIRMED', 'FINDING_DRIVER'].includes(record.status) ? (
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              title="Hủy đơn"
            >
              Hủy
            </Button>
          ) : ['DRIVER_ACCEPTED', 'PICKING_UP', 'DELIVERING'].includes(record.status) ? (
            <Button
              type="primary"
              size="small"
              onClick={() => handleTrack(record.id)}
              title="Theo dõi"
            >
              Theo dõi
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/stores')}
          style={{ marginBottom: '10px' }}
        >
          Quay lại
        </Button>
        <Title level={2}>📦 Lịch sử đơn hàng</Title>
      </div>

      {orders.length === 0 ? (
        <Card>
          <Empty
            description="Chưa có đơn hàng nào"
            style={{ marginTop: '50px', marginBottom: '50px' }}
          />
          <Button
            type="primary"
            onClick={() => navigate('/stores')}
            style={{ background: '#ff6b35' }}
          >
            Tiếp tục mua sắm
          </Button>
        </Card>
      ) : (
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      {/* Order Details Modal */}
      <Modal
        title={`Chi tiết đơn hàng #${selectedOrder?.id}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Đóng
          </Button>,
          ['DRIVER_ACCEPTED', 'PICKING_UP', 'DELIVERING'].includes(selectedOrder?.status) ? (
            <Button
              key="track"
              type="primary"
              onClick={() => {
                navigate(`/order/${selectedOrder.id}`);
                setDetailsVisible(false);
              }}
            >
              Theo dõi đơn hàng
            </Button>
          ) : null,
        ]}
      >
        {selectedOrder && (
          <div className="order-details">
            {/* Status and Pricing */}
            <div style={{ marginBottom: '20px' }}>
              <Tag color={statusColors[selectedOrder.status]} style={{ fontSize: '14px', padding: '5px 10px' }}>
                {statusTexts[selectedOrder.status]}
              </Tag>
              <div style={{ marginTop: '10px' }}>
                <Text strong>Tổng tiền: </Text>
                <Text style={{ color: '#ff6b35', fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedOrder.total_price?.toLocaleString()}đ
                </Text>
              </div>
            </div>

            <Divider />

            {/* Store Info */}
            <div style={{ marginBottom: '15px' }}>
              <Title level={5}>🏪 Cửa hàng</Title>
              {selectedOrder.store ? (
                <>
                  <p><strong>{selectedOrder.store.name || 'N/A'}</strong></p>
                  {selectedOrder.store.address && selectedOrder.store.address.trim() ? (
                    <p>
                      <EnvironmentOutlined /> {selectedOrder.store.address}
                    </p>
                  ) : (
                    <p style={{ color: '#999' }}>
                      <EnvironmentOutlined /> (Chưa cập nhật địa chỉ)
                    </p>
                  )}
                  {selectedOrder.store.phone && (
                    <p>
                      <PhoneOutlined /> {selectedOrder.store.phone}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ color: '#ff4d4f' }}>
                  ⚠️ Thông tin cửa hàng không khả dụng (store_id bị NULL)
                </p>
              )}
            </div>

            {/* Delivery Address */}
            <div style={{ marginBottom: '15px' }}>
              <Title level={5}>📍 Địa chỉ giao hàng</Title>
              <p>{selectedOrder.delivery_address}</p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                Tọa độ: {parseFloat(selectedOrder.delivery_lat)?.toFixed(4)}, {parseFloat(selectedOrder.delivery_lng)?.toFixed(4)}
              </p>
            </div>

            {/* Driver Info */}
            {selectedOrder.driver && (
              <div style={{ marginBottom: '15px' }}>
                <Title level={5}>🚗 Tài xế</Title>
                <p><strong>{selectedOrder.driver.username}</strong></p>
                <p>
                  <PhoneOutlined /> {selectedOrder.driver.phone}
                </p>
                <Tag color={selectedOrder.driver.is_online ? 'green' : 'red'}>
                  {selectedOrder.driver.is_online ? 'Đang hoạt động' : 'Ngoài tuyến'}
                </Tag>
              </div>
            )}

            <Divider />

            {/* Items */}
            <div style={{ marginBottom: '15px' }}>
              <Title level={5}>🍽️ Các món ăn</Title>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '10px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {item.food?.image_url && (
                      <Image
                        src={getImageSrc(item.food.image_url)}
                        width={60}
                        height={60}
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                        preview={false}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        {item.food?.name}
                      </p>
                      <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                        x{item.quantity} × {item.price?.toLocaleString()}đ = {(item.quantity * item.price)?.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Pricing Breakdown */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Tạm tính:</span>
                <span>{selectedOrder.total_food_price?.toLocaleString()}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Phí giao ({parseFloat(selectedOrder.distance_km)?.toFixed(1)} km):</span>
                <span>{selectedOrder.shipping_fee?.toLocaleString()}đ</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '2px solid #ff6b35',
              }}>
                <strong>Tổng cộng:</strong>
                <strong style={{ color: '#ff6b35', fontSize: '16px' }}>
                  {selectedOrder.total_price?.toLocaleString()}đ
                </strong>
              </div>
            </div>

            <Divider />

            {/* Timeline */}
            <div>
              <Title level={5}>⏱️ Lịch sử</Title>
              <p style={{ fontSize: '12px' }}>
                <ClockCircleOutlined /> Đặt hàng: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
              </p>
              {selectedOrder.completed_at && (
                <p style={{ fontSize: '12px' }}>
                  <ClockCircleOutlined /> Hoàn thành: {new Date(selectedOrder.completed_at).toLocaleString('vi-VN')}
                </p>
              )}
              {selectedOrder.notes && (
                <>
                  <Divider style={{ margin: '10px 0' }} />
                  <p><strong>Ghi chú:</strong> {selectedOrder.notes}</p>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderHistory;
