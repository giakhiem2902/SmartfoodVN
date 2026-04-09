import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ShopOutlined, StopOutlined } from '@ant-design/icons';
import apiClient from '../services/apiClient';

const { Title, Text } = Typography;
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getStoreRegistrations();
      setRegistrations(Array.isArray(res) ? res : []);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách đăng ký cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const stats = useMemo(() => ({
    total: registrations.length,
    pending: registrations.filter((item) => item.status === 'PENDING').length,
    approved: registrations.filter((item) => item.status === 'APPROVED').length,
    rejected: registrations.filter((item) => item.status === 'REJECTED').length,
  }), [registrations]);

  const handleReview = async (registration, status) => {
    try {
      const rejectionReason = status === 'REJECTED'
        ? (window.prompt('Nhập lý do từ chối:', registration.rejection_reason || 'Thiếu thông tin xác minh') || 'Thiếu thông tin xác minh')
        : '';

      await apiClient.reviewStoreRegistration(registration.id, { status, rejectionReason });
      message.success(status === 'APPROVED' ? 'Đã duyệt cửa hàng thành công' : 'Đã từ chối phiếu đăng ký');
      loadRegistrations();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật phiếu đăng ký');
    }
  };

  const columns = [
    {
      title: 'Người gửi',
      key: 'user',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.user?.username || 'Người dùng'}</div>
          <Text type="secondary">{record.user?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Tên cửa hàng',
      dataIndex: 'store_name',
      key: 'store_name',
    },
    {
      title: 'Loại hàng',
      dataIndex: 'business_type',
      key: 'business_type',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'store_address',
      key: 'store_address',
      render: (value) => <div style={{ maxWidth: 240 }}>{value}</div>,
    },
    {
      title: 'Ảnh cửa hàng',
      dataIndex: 'store_image_url',
      key: 'store_image_url',
      render: (value) => value ? (
        <img
          src={value.startsWith('http') ? value : `${API_BASE}${value}`}
          alt="store"
          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
        />
      ) : <Text type="secondary">Không có</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = {
          PENDING: 'orange',
          APPROVED: 'green',
          REJECTED: 'red',
        };
        return <Tag color={color[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            disabled={record.status === 'APPROVED'}
            onClick={() => handleReview(record, 'APPROVED')}
          >
            Duyệt
          </Button>
          <Button
            danger
            size="small"
            disabled={record.status === 'REJECTED'}
            onClick={() => handleReview(record, 'REJECTED')}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3} style={{ marginTop: 0 }}>📊 Admin Dashboard</Title>
      <Text type="secondary">Xét duyệt các phiếu đăng ký cửa hàng và theo dõi tiến độ onboarding seller.</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 16, marginBottom: 16 }}>
        <Col xs={24} md={6}><Card><Statistic title="Tổng phiếu" value={stats.total} prefix={<ShopOutlined />} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Chờ duyệt" value={stats.pending} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Đã duyệt" value={stats.approved} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="Từ chối" value={stats.rejected} prefix={<StopOutlined />} /></Card></Col>
      </Row>

      <Card title="Phiếu đăng ký cửa hàng" variant="borderless" style={{ borderRadius: 16 }}>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={registrations} scroll={{ x: 900 }} />
      </Card>
    </div>
  );
}
