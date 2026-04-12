import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Tag,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import '../styles/Management.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Không tìm thấy token. Vui lòng đăng nhập lại!');
        setLoading(false);
        return;
      }
      const response = await axios.get('http://localhost:5000/api/admin/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
      message.error(error.response?.data?.message || 'Lỗi khi tải danh sách orders');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('http://localhost:5000/api/admin/orders/statistics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(response.data);
    } catch (error) {
      console.log('Lỗi khi tải statistics');
    }
  };

  const handleViewOrder = (record) => {
    setViewingOrder(record);
    setIsModalVisible(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      message.success('Cập nhật trạng thái thành công!');
      fetchOrders();
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      String(order.id).toLowerCase().includes(searchText.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchText.toLowerCase()) ||
      order.store.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <strong>{id}</strong>,
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer',
      key: 'customer',
      sorter: (a, b) => a.customer.localeCompare(b.customer),
    },
    {
      title: 'Cửa Hàng',
      dataIndex: 'store',
      key: 'store',
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => <strong>{amount.toLocaleString('vi-VN')} đ</strong>,
    },
    {
      title: 'Tài Xế',
      dataIndex: 'driver',
      key: 'driver',
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Confirmed', value: 'Confirmed' },
        { text: 'Finding Driver', value: 'Finding Driver' },
        { text: 'Driver Accepted', value: 'Driver Accepted' },
        { text: 'Picking Up', value: 'Picking Up' },
        { text: 'Delivering', value: 'Delivering' },
        { text: 'Completed', value: 'Completed' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const colors = {
          'Pending': 'orange',
          'Confirmed': 'blue',
          'Finding Driver': 'cyan',
          'Driver Accepted': 'purple',
          'Picking Up': 'geekblue',
          'Delivering': 'cyan',
          'Completed': 'green',
          'Cancelled': 'red',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Ngày Order',
      dataIndex: 'orderDate',
      key: 'orderDate',
      sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
    },
    {
      title: 'Hành Động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewOrder(record)}
          />
          <Select
            style={{ width: 100, fontSize: '12px' }}
            defaultValue={record.status}
            size="small"
            onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
          >
            <Select.Option value="Pending">Pending</Select.Option>
            <Select.Option value="Confirmed">Confirmed</Select.Option>
            <Select.Option value="Finding Driver">Finding Driver</Select.Option>
            <Select.Option value="Driver Accepted">Driver Accepted</Select.Option>
            <Select.Option value="Picking Up">Picking Up</Select.Option>
            <Select.Option value="Delivering">Delivering</Select.Option>
            <Select.Option value="Completed">Completed</Select.Option>
            <Select.Option value="Cancelled">Cancelled</Select.Option>
          </Select>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Orders"
              value={stats.totalOrders}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoàn Thành"
              value={stats.completedOrders}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang Chờ"
              value={stats.pendingOrders}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã Hủy"
              value={stats.cancelledOrders}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card
        title="Quản Lý Orders"
        extra={
          <Input.Search
            placeholder="Tìm kiếm order..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            responsive
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={`Chi Tiết Order: ${viewingOrder?.id}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        {viewingOrder && (
          <div style={{ marginTop: '20px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <p><strong>Khách Hàng:</strong> {viewingOrder.customer}</p>
              </Col>
              <Col xs={24} sm={12}>
                <p><strong>Cửa Hàng:</strong> {viewingOrder.store}</p>
              </Col>
              <Col xs={24} sm={12}>
                <p><strong>Tài Xế:</strong> {viewingOrder.driver}</p>
              </Col>
              <Col xs={24} sm={12}>
                <p><strong>Ngày Order:</strong> {viewingOrder.orderDate}</p>
              </Col>
              <Col xs={24} sm={12}>
                <p><strong>Phương Thức Thanh Toán:</strong> {viewingOrder.paymentMethod}</p>
              </Col>
              <Col xs={24} sm={12}>
                <p><strong>Thời Gian Giao:</strong> {viewingOrder.deliveryTime}</p>
              </Col>
              <Col xs={24}>
                <p><strong>Số Lượng Items:</strong> {viewingOrder.items}</p>
              </Col>
              <Col xs={24}>
                <p style={{ fontSize: '16px', color: '#faad14' }}>
                  <strong>Tổng Tiền: {viewingOrder.amount.toLocaleString('vi-VN')} đ</strong>
                </p>
              </Col>
              <Col xs={24}>
                <p>
                  <strong>Trạng Thái:</strong>{' '}
                  <Tag
                    color={
                      viewingOrder.status === 'Completed'
                        ? 'green'
                        : viewingOrder.status === 'Cancelled'
                        ? 'red'
                        : 'blue'
                    }
                  >
                    {viewingOrder.status}
                  </Tag>
                </p>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </>
  );
};

export default OrderManagement;
