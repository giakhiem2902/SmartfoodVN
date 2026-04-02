import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, Row, Col, Statistic, Table, Button, Space, Tag } from 'antd';
import { DollarOutlined, ShoppingOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import socketService from '../services/socketService';
import apiClient from '../services/apiClient';

const AdminDashboard = ({ token, storeId }) => {
  const [orders, setOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    activeDrivers: 0,
  });

  useEffect(() => {
    // Connect Socket.io
    socketService.connect();
    socketService.socket.emit('ADMIN_JOIN', { adminId: token });

    // Listen for new orders
    socketService.socket.on('NEW_ORDER', (order) => {
      setOrders((prevOrders) => [order, ...prevOrders]);
      updateStats();
    });

    socketService.socket.on('ORDER_STATUS_CHANGED', (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === data.orderId ? { ...order, status: data.status } : order
        )
      );
      updateStats();
    });

    return () => {
      socketService.socket.emit('ADMIN_LEAVE');
    };
  }, [token]);

  const updateStats = async () => {
    try {
      // Fetch and calculate stats
      const response = await apiClient.getUserOrders(token);
      if (response && Array.isArray(response)) {
        const completedOrders = response.filter((o) => o.status === 'COMPLETED');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);

        setStats({
          totalOrders: response.length,
          completedOrders: completedOrders.length,
          totalRevenue,
          activeDrivers: response.filter((o) => o.driver_id).length,
        });
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'User',
      dataIndex: ['user', 'username'],
      key: 'user',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          PENDING: 'orange',
          CONFIRMED: 'blue',
          FINDING_DRIVER: 'cyan',
          DRIVER_ACCEPTED: 'green',
          DELIVERING: 'blue',
          COMPLETED: 'green',
          CANCELLED: 'red',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Total Price',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price) => `${price.toLocaleString()} đ`,
    },
    {
      title: 'Distance',
      dataIndex: 'distance_km',
      key: 'distance_km',
      render: (distance) => `${distance.toFixed(1)} km`,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 Admin Dashboard</h1>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '30px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed Orders"
              value={stats.completedOrders}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="đ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Drivers"
              value={stats.activeDrivers}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="Daily Revenue">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Order Status Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card title="Orders" style={{ marginTop: '30px' }}>
        <Table
          columns={columns}
          dataSource={orders}
          pagination={{ pageSize: 10 }}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
