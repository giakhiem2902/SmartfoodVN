import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Select, message, Spin, Divider, Space, Progress, Button } from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HomeOutlined,
  CoffeeOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import '../styles/Dashboard.css';

const Statistics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7days');
  const [chartData, setChartData] = useState([]);
  const [topFoods, setTopFoods] = useState([]);
  const [topStores, setTopStores] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [comprehensiveStats, setComprehensiveStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalStores: 0,
    totalFoods: 0,
  });

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  const handleGoHome = () => {
    navigate('/admin');
  };

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Không tìm thấy token. Vui lòng đăng nhập lại!');
        setLoading(false);
        return;
      }

      // Fetch all required data
      const [statsResponse, metricsResponse, detailedResponse, chartResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/statistics', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { totalUsers: 0, totalOrders: 0, totalRevenue: 0, activeDrivers: 0 } })),
        axios.get('http://localhost:5000/api/admin/statistics/metrics', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { totalUsers: 0, totalDrivers: 0, totalStores: 0, totalFoods: 0 } })),
        axios.get('http://localhost:5000/api/admin/statistics/detailed', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { topFoods: [], topStores: [], orderStats: [] } })),
        axios.get('http://localhost:5000/api/admin/orders/chart', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: [] })),
      ]);

      setChartData(chartResponse.data || []);
      setComprehensiveStats(metricsResponse.data);
      setTopFoods(detailedResponse.data.topFoods || []);
      setTopStores(detailedResponse.data.topStores || []);
      setOrderStats(detailedResponse.data.orderStats || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      message.error('Lỗi khi tải thống kê');
    }
    setLoading(false);
  };

  const foodColumns = [
    {
      title: '#',
      key: 'index',
      render: (_, __, index) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{index + 1}</span>,
      width: 50,
    },
    {
      title: '🍔 Tên Món Ăn',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '📦 Số Lượng Bán',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      render: (qty) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{qty} cái</span>,
    },
    {
      title: '💰 Doanh Thu',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a, b) => a.revenue - b.revenue,
      render: (revenue) => (
        <span style={{ color: '#faad14', fontWeight: 'bold' }}>
          {(revenue / 1000000).toFixed(1)}M đ
        </span>
      ),
    },
  ];

  const storeColumns = [
    {
      title: '#',
      key: 'index',
      render: (_, __, index) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{index + 1}</span>,
      width: 50,
    },
    {
      title: '🏪 Tên Cửa Hàng',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '📊 Số Đơn Hàng',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a, b) => a.orders - b.orders,
      render: (orders) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{orders}</span>,
    },
    {
      title: '💰 Doanh Thu',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a, b) => a.revenue - b.revenue,
      render: (revenue) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {(revenue / 1000000).toFixed(1)}M đ
        </span>
      ),
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: 'success',
      CANCELLED: 'error',
      PENDING: 'processing',
      CONFIRMED: 'blue',
    };
    return colors[status] || 'default';
  };

  return (
    <Spin spinning={loading}>
      <div className="dashboard-container" style={{ padding: '24px' }}>
        {/* Header */}
        <Card style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#262626' }}>
                📊 Bảng Điều Khiển Thống Kê
              </h1>
            </Col>
            <Col>
              <Space>
                <Select
                  value={timeRange}
                  onChange={setTimeRange}
                  style={{ width: 180 }}
                  options={[
                    { label: '7 Ngày Qua', value: '7days' },
                    { label: '30 Ngày Qua', value: '30days' },
                    { label: '90 Ngày Qua', value: '90days' },
                    { label: 'Tất Cả', value: 'all' },
                  ]}
                />
                <Button type="primary" onClick={fetchStatistics}>
                  🔄 Cập Nhật
                </Button>
                <Button icon={<ArrowLeftOutlined />} onClick={handleGoHome}>
                  Quay Lại
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Key Metrics - KPI Cards */}
        {comprehensiveStats && (
          <>
            <Card style={{ marginBottom: '24px', borderRadius: '8px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>👥 Tổng Người Dùng</span>}
                      value={comprehensiveStats.totalUsers || 0}
                      valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>🏪 Tổng Cửa Hàng</span>}
                      value={comprehensiveStats.totalStores || 0}
                      valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>🚗 Tài Xế Hoạt Động</span>}
                      value={comprehensiveStats.totalDrivers || 0}
                      valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>🍔 Tổng Sản Phẩm</span>}
                      value={comprehensiveStats.totalFoods || 0}
                      valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </>
        )}

        {/* Charts Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={12}>
            <Card
              title="📈 Xu Hướng Đơn Hàng & Doanh Thu"
              style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    stroke="#1890ff"
                    strokeWidth={3}
                    dot={{ fill: '#1890ff', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Số Đơn Hàng"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#52c41a"
                    strokeWidth={3}
                    dot={{ fill: '#52c41a', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Doanh Thu (K đ)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="📊 Trạng Thái Đơn Hàng"
              style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              {orderStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={orderStats}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ status, value }) => `${status}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="status"
                    >
                      {orderStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#999' }}>Không có dữ liệu</p>
              )}
            </Card>
          </Col>
        </Row>

        {/* Order Status Details */}
        {orderStats.length > 0 && (
          <Card style={{ marginBottom: '24px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>📋 Chi Tiết Trạng Thái Đơn Hàng</h3>
            <Row gutter={[16, 16]}>
              {orderStats.map((stat, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <Card
                    style={{
                      borderLeft: `4px solid ${COLORS[index % COLORS.length]}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <h4 style={{ color: COLORS[index % COLORS.length], marginBottom: '8px' }}>
                      {stat.status}
                    </h4>
                    <Statistic
                      value={stat.value}
                      valueStyle={{ color: COLORS[index % COLORS.length], fontSize: '24px' }}
                    />
                    <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                      Đơn hàng: {stat.value}
                    </p>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* Top Foods */}
        <Card
          title="🏆 Top 10 Món Ăn Bán Chạy Nhất"
          style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <Table
            columns={foodColumns}
            dataSource={topFoods}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            responsive
            rowClassName={(record, index) => index === 0 ? 'table-row-highlight' : ''}
          />
        </Card>

        {/* Top Stores */}
        <Card
          title="⭐ Top 10 Cửa Hàng Xuất Sắc"
          style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <Table
            columns={storeColumns}
            dataSource={topStores}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            responsive
            rowClassName={(record, index) => index === 0 ? 'table-row-highlight' : ''}
          />
        </Card>
      </div>

      <style>{`
        .table-row-highlight {
          background-color: #fafafa;
          font-weight: 500;
        }
        .dashboard-container {
          background: #fafafa;
          border-radius: 8px;
        }
      `}</style>
    </Spin>
  );
};

export default Statistics;
