import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Space,
  Spin,
  message,
  Modal,
  Input,
} from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TruckOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeDrivers: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Không tìm thấy token. Vui lòng đăng nhập lại!');
        setLoading(false);
        return;
      }

      // Fetch statistics
      const statsResponse = await axios.get('http://localhost:5000/api/admin/statistics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(statsResponse.data);

      // Fetch chart data (orders by date)
      const chartResponse = await axios.get('http://localhost:5000/api/admin/orders/chart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChartData(chartResponse.data || []);

      // Fetch recent orders
      const ordersResponse = await axios.get('http://localhost:5000/api/admin/orders/recent', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRecentOrders(ordersResponse.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu: ' + (error.message || 'Unknown error'));
    }
    setLoading(false);
  };

  const pieData = [
    { name: 'Completed', value: 65 },
    { name: 'Pending', value: 20 },
    { name: 'Cancelled', value: 15 },
  ];
  const COLORS = ['#52c41a', '#faad14', '#f5222d'];

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Số Tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          Completed: '#52c41a',
          Pending: '#faad14',
          Delivering: '#1890ff',
          Cancelled: '#f5222d',
        };
        return (
          <span
            style={{
              color: colors[status] || '#000',
              fontWeight: 'bold',
            }}
          >
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="dashboard-container">
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng Users"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng Orders"
                value={stats.totalOrders}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng Doanh Thu"
                value={stats.totalRevenue}
                suffix="đ"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#faad14' }}
                formatter={(value) =>
                  `${(value / 1000000).toFixed(1)}M`
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Drivers Đang Hoạt Động"
                value={stats.activeDrivers}
                prefix={<TruckOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
          <Col xs={24} lg={16}>
            <Card title="Thống Kê Orders & Doanh Thu (7 ngày)" className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#1890ff" name="Orders" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#52c41a" name="Revenue (K)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Tỷ Lệ Trạng Thái Orders" className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Recent Orders */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              title="Đơn Hàng Gần Đây"
              extra={
                <Button type="primary" icon={<PlusOutlined />}>
                  Thêm Mới
                </Button>
              }
            >
              <Table
                columns={columns}
                dataSource={recentOrders}
                pagination={false}
                rowKey="id"
                responsive
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default Dashboard;
