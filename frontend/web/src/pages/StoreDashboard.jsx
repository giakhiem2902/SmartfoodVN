import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FireOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/useStore';

const PRIMARY = '#ff6b35';
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, color }) {
  return (
    <Card
      style={{
        borderRadius: 16,
        border: `1.5px solid ${color}22`,
        background: `linear-gradient(135deg, ${color}10, #fff)`,
        boxShadow: `0 4px 16px ${color}18`,
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { style: { fontSize: 24, color } })}
        </div>
        <Statistic
          title={<span style={{ fontSize: 13, color: '#888' }}>{title}</span>}
          value={value}
          valueStyle={{ fontSize: 26, fontWeight: 700, color }}
        />
      </div>
    </Card>
  );
}

const { Title, Text } = Typography;

const statusMeta = {
  PENDING: { color: 'orange', text: 'Đơn mới chờ xác nhận' },
  CONFIRMED: { color: 'blue', text: 'Quán đang làm món' },
  FINDING_DRIVER: { color: 'cyan', text: 'Đang tìm tài xế' },
  DRIVER_ACCEPTED: { color: 'green', text: 'Tài xế đã nhận đơn' },
  PICKING_UP: { color: 'purple', text: 'Tài xế đang lấy hàng' },
  DELIVERING: { color: 'processing', text: 'Đã giao cho tài xế' },
  COMPLETED: { color: 'success', text: 'Đơn hàng đã hoàn thành' },
  CANCELLED: { color: 'red', text: 'Đã hủy' },
};

const getNextStoreAction = (order) => {
  switch (order.status) {
    case 'PENDING':
      return { label: '✅ Xác nhận đơn hàng', status: 'CONFIRMED' };
    case 'CONFIRMED':
      return { label: '🍳 Món xong – Gọi tài xế', status: 'FINDING_DRIVER' };
    case 'DRIVER_ACCEPTED':
    case 'PICKING_UP':
      return { label: '🛵 Đã giao cho tài xế', status: 'DELIVERING' };
    default:
      return null;
  }
};

export default function StoreDashboard() {
  const { user } = useAuthStore();
  const [categoryForm] = Form.useForm();
  const [foodForm] = Form.useForm();
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [submittingFood, setSubmittingFood] = useState(false);
  const [foodImageList, setFoodImageList] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');

  const loadDashboard = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const myStore = await apiClient.getMyStore();
      setStore(myStore);

      const [categoryRes, foodRes, orderRes] = await Promise.all([
        apiClient.getStoreCategories(myStore.id),
        apiClient.getStoreFoods(myStore.id, true), // true = lấy tất cả foods (bao gồm unavailable)
        apiClient.getStoreOrders(myStore.id),
      ]);

      setCategories(Array.isArray(categoryRes) ? categoryRes : []);
      setFoods(Array.isArray(foodRes) ? foodRes : []);
      setOrders(Array.isArray(orderRes) ? orderRes : []);
    } catch (error) {
      if (error.response?.status === 404) {
        setStore(null);
      } else if (!silent) {
        message.error(error.response?.data?.message || 'Không thể tải dữ liệu cửa hàng');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const intervalId = window.setInterval(() => {
      loadDashboard(true);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  const stats = useMemo(() => ({
    totalOrders: orders.length,
    pendingOrders: orders.filter((order) => ['PENDING', 'CONFIRMED', 'FINDING_DRIVER', 'DRIVER_ACCEPTED', 'PICKING_UP'].includes(order.status)).length,
    completedOrders: orders.filter((order) => order.status === 'COMPLETED').length,
    totalFoods: foods.length,
  }), [orders, foods]);

  const handleCreateCategory = async (values) => {
    if (!store) return;
    try {
      setSubmittingCategory(true);
      await apiClient.createStoreCategory(store.id, values);
      message.success('✅ Đã thêm danh mục mới');
      categoryForm.resetFields();
      loadDashboard();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể thêm danh mục');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleCreateFood = async (values) => {
    if (!store) return;
    try {
      setSubmittingFood(true);
      const formData = new FormData();
      formData.append('categoryId', values.categoryId);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('price', values.price);
      formData.append('preparationTime', values.preparationTime || 15);

      if (foodImageList[0]?.originFileObj) {
        formData.append('image', foodImageList[0].originFileObj);
      }

      await apiClient.createStoreFood(store.id, formData);
      message.success('✅ Đã thêm món ăn mới');
      foodForm.resetFields();
      setFoodImageList([]);
      loadDashboard();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể thêm món ăn');
    } finally {
      setSubmittingFood(false);
    }
  };

  const handleToggleAvailability = async (food) => {
    try {
      await apiClient.updateFoodAvailability(food.id, !food.is_available);
      message.success('Đã cập nhật trạng thái món ăn');
      loadDashboard();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật món ăn');
    }
  };

  const handleOrderAction = async (order) => {
    const nextAction = getNextStoreAction(order);
    if (!nextAction) return;

    try {
      await apiClient.updateOrderStatus(order.id, nextAction.status);
      message.success(`Đã cập nhật đơn #${order.id}`);
      loadDashboard();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái đơn');
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <Card loading style={{ borderRadius: 16 }} />
      </div>
    );
  }

  // ── No store ─────────────────────────────────────────────────────────────
  if (!store) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <Alert
          type="warning"
          showIcon
          message="Tài khoản này chưa có cửa hàng được duyệt"
          description="Hãy gửi phiếu đăng ký bán hàng trước, sau khi admin duyệt bạn sẽ thấy dashboard này."
          action={
            <Button
              style={{ background: PRIMARY, borderColor: PRIMARY, color: '#fff', borderRadius: 10 }}
              onClick={() => window.location.assign('/become-store')}
            >
              Đăng ký bán hàng
            </Button>
          }
        />
      </div>
    );
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 88,
      render: (v) => <span style={{ fontWeight: 700, color: PRIMARY }}>#{v}</span>,
    },
    {
      title: 'Khách hàng',
      key: 'user',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.user?.username || 'Khách vãng lai'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.user?.phone || r.delivery_address}</Text>
        </div>
      ),
    },
    {
      title: 'Món đặt',
      key: 'items',
      render: (_, r) => (
        <div style={{ maxWidth: 260, fontSize: 13 }}>
          {(r.items || []).map((item) => `${item.food?.name || 'Món ăn'} x${item.quantity}`).join(', ')}
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 130,
      render: (v) => (
        <span style={{ fontWeight: 700, color: PRIMARY }}>
          {Number(v || 0).toLocaleString('vi-VN')}đ
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (s) => <Tag color={statusMeta[s]?.color || 'default'}>{statusMeta[s]?.text || s}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 210,
      render: (_, r) => {
        const next = getNextStoreAction(r);
        if (!next) return <Text type="secondary">—</Text>;
        return (
          <Button
            size="small"
            style={{ background: PRIMARY, borderColor: PRIMARY, color: '#fff', borderRadius: 8 }}
            onClick={() => handleOrderAction(r)}
          >
            {next.label}
          </Button>
        );
      },
    },
  ];

  const foodColumns = [
    {
      title: 'Ảnh',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 64,
      render: (v) => v ? (
        <img
          src={v.startsWith('http') ? v : `${API_BASE}${v}`}
          alt="food"
          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10 }}
        />
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: 10, background: '#fff3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          🍽️
        </div>
      ),
    },
    {
      title: 'Tên món',
      dataIndex: 'name',
      key: 'name',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.category?.name || 'Chưa có danh mục'}</Text>
        </div>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      render: (v) => <span style={{ fontWeight: 700, color: PRIMARY }}>{Number(v || 0).toLocaleString('vi-VN')}đ</span>,
    },
    {
      title: 'Sẵn bán',
      key: 'is_available',
      width: 100,
      render: (_, r) => (
        <Switch
          checked={Boolean(r.is_available)}
          onChange={() => handleToggleAvailability(r)}
          style={r.is_available ? { background: PRIMARY } : {}}
        />
      ),
    },
  ];

  // ── Tab items ─────────────────────────────────────────────────────────────
  const tabItems = [
    {
      key: 'orders',
      label: (
        <span>
          <ShoppingCartOutlined /> Đơn hàng
          {stats.pendingOrders > 0 && (
            <Badge count={stats.pendingOrders} size="small" style={{ marginLeft: 6, background: PRIMARY }} />
          )}
        </span>
      ),
      children: orders.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn hàng nào" />
      ) : (
        <Table
          rowKey="id"
          columns={orderColumns}
          dataSource={orders}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 8 }}
        />
      ),
    },
    {
      key: 'menu',
      label: <span><EditOutlined /> Thực đơn ({foods.length})</span>,
      children: foods.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có món ăn nào" />
      ) : (
        <Table
          rowKey="id"
          columns={foodColumns}
          dataSource={foods}
          pagination={{ pageSize: 8 }}
        />
      ),
    },
    {
      key: 'add-food',
      label: <span><PlusOutlined /> Thêm món ăn</span>,
      children: (
        <Row gutter={[24, 24]}>
          {/* Category form */}
          <Col xs={24} lg={9}>
            <Card
              title={<span style={{ color: PRIMARY, fontWeight: 700 }}>🗂️ Thêm danh mục mới</span>}
              style={{ borderRadius: 16, border: '1.5px solid #ffe4cc', boxShadow: '0 4px 16px rgba(255,107,53,0.08)' }}
            >
              <Form form={categoryForm} layout="vertical" onFinish={handleCreateCategory}>
                <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
                  <Input placeholder="Ví dụ: Cơm tấm, Nước uống" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Form.Item name="description" label="Mô tả">
                  <Input.TextArea rows={3} placeholder="Mô tả ngắn cho danh mục" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submittingCategory}
                  icon={<PlusOutlined />}
                  style={{ background: PRIMARY, borderColor: PRIMARY, borderRadius: 10 }}
                >
                  Thêm danh mục
                </Button>
              </Form>

              {categories.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <Text strong style={{ color: '#555' }}>Danh mục hiện có:</Text>
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {categories.map((c) => (
                      <Tag key={c.id} color="orange" style={{ borderRadius: 8, padding: '2px 10px' }}>
                        {c.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </Col>

          {/* Food form */}
          <Col xs={24} lg={15}>
            <Card
              title={<span style={{ color: PRIMARY, fontWeight: 700 }}>🍽️ Thêm món ăn mới</span>}
              style={{ borderRadius: 16, border: '1.5px solid #ffe4cc', boxShadow: '0 4px 16px rgba(255,107,53,0.08)' }}
            >
              <Form form={foodForm} layout="vertical" onFinish={handleCreateFood}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
                      <Select placeholder="Chọn danh mục">
                        {categories.map((c) => (
                          <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="price" label="Giá bán (VNĐ)" rules={[{ required: true, message: 'Nhập giá bán' }]}>
                      <InputNumber min={0} style={{ width: '100%', borderRadius: 10 }} placeholder="45000" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="name" label="Tên món ăn" rules={[{ required: true, message: 'Nhập tên món' }]}>
                  <Input placeholder="Ví dụ: Cơm tấm sườn bì chả" style={{ borderRadius: 10 }} />
                </Form.Item>

                <Form.Item name="description" label="Mô tả món ăn">
                  <Input.TextArea rows={3} placeholder="Mô tả ngắn về món ăn, nguyên liệu, đặc trưng..." style={{ borderRadius: 10 }} />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="preparationTime" label="Thời gian chuẩn bị (phút)">
                      <InputNumber min={1} max={120} style={{ width: '100%', borderRadius: 10 }} placeholder="15" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Ảnh món ăn">
                      <Upload
                        beforeUpload={() => false}
                        maxCount={1}
                        fileList={foodImageList}
                        onChange={({ fileList }) => setFoodImageList(fileList)}
                        listType="picture"
                        accept="image/*"
                      >
                        <Button icon={<UploadOutlined />} style={{ borderRadius: 10 }}>Chọn ảnh</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submittingFood}
                  icon={<PlusOutlined />}
                  style={{ background: PRIMARY, borderColor: PRIMARY, borderRadius: 10 }}
                >
                  Thêm món ăn
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

      {/* Hero header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ff6b35 0%, #ff9a5c 60%, #ffb347 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(255,107,53,0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <ShopOutlined style={{ fontSize: 28, color: '#fff' }} />
              <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>
                {store.name}
              </Title>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14 }}>
              📍 {store.address || 'Chưa cập nhật địa chỉ'}
            </Text>
            <br />
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              Xin chào, <strong style={{ color: '#fff' }}>{user?.username}</strong> 👋 — Quản lý cửa hàng của bạn tại đây
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadDashboard()}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 10 }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <StatCard title="Tổng đơn hàng" value={stats.totalOrders} icon={<ShoppingCartOutlined />} color="#ff6b35" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard title="Đang xử lý" value={stats.pendingOrders} icon={<ClockCircleOutlined />} color="#fa8c16" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard title="Đã hoàn thành" value={stats.completedOrders} icon={<CheckCircleOutlined />} color="#52c41a" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard title="Món đang bán" value={stats.totalFoods} icon={<FireOutlined />} color="#1890ff" />
        </Col>
      </Row>

      {/* Main tabs */}
      <Card
        style={{
          borderRadius: 20,
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          border: '1.5px solid #ffe4cc',
        }}
        styles={{ body: { padding: '0 24px 24px' } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ borderBottom: '2px solid #fff3ee', marginBottom: 20 }}
          tabBarGutter={24}
        />
      </Card>
    </div>
  );
}
