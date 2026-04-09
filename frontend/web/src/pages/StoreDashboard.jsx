import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/useStore';

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
      return { label: 'Xác nhận đơn hàng', status: 'CONFIRMED' };
    case 'CONFIRMED':
      return { label: 'Món đã xong - gọi tài xế', status: 'FINDING_DRIVER' };
    case 'DRIVER_ACCEPTED':
    case 'PICKING_UP':
      return { label: 'Xác nhận đã giao cho tài xế', status: 'DELIVERING' };
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

  const loadDashboard = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const myStore = await apiClient.getMyStore();
      setStore(myStore);

      const [categoryRes, foodRes, orderRes] = await Promise.all([
        apiClient.getStoreCategories(myStore.id),
        apiClient.getStoreFoods(myStore.id),
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
      message.success('Đã thêm danh mục mới');
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
      message.success('Đã thêm món ăn mới');
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
      message.success(`Đã cập nhật đơn #${order.id} sang ${nextAction.status}`);
      loadDashboard();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái đơn');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <Card loading />
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <Alert
          type="warning"
          showIcon
          message="Tài khoản này chưa có cửa hàng được duyệt"
          description="Hãy gửi phiếu đăng ký bán hàng trước, sau khi admin duyệt bạn sẽ thấy dashboard này."
          action={<Button onClick={() => window.location.assign('/become-store')}>Đăng ký bán hàng</Button>}
        />
      </div>
    );
  }

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (value) => `#${value}`,
    },
    {
      title: 'Khách hàng',
      key: 'user',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.user?.username || 'Khách vãng lai'}</div>
          <Text type="secondary">{record.user?.phone || record.delivery_address}</Text>
        </div>
      ),
    },
    {
      title: 'Món đặt',
      key: 'items',
      render: (_, record) => (
        <div style={{ maxWidth: 260 }}>
          {(record.items || []).map((item) => `${item.food?.name || 'Món ăn'} x${item.quantity}`).join(', ')}
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 120,
      render: (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => <Tag color={statusMeta[status]?.color || 'default'}>{statusMeta[status]?.text || status}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 190,
      render: (_, record) => {
        const nextAction = getNextStoreAction(record);
        if (!nextAction) {
          return <Text type="secondary">—</Text>;
        }

        return (
          <Button type="primary" size="small" onClick={() => handleOrderAction(record)}>
            {nextAction.label}
          </Button>
        );
      },
    },
  ];

  const foodColumns = [
    {
      title: 'Tên món',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          <Text type="secondary">{record.category?.name || 'Chưa có danh mục'}</Text>
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`,
    },
    {
      title: 'Sẵn bán',
      key: 'is_available',
      width: 120,
      render: (_, record) => (
        <Switch checked={Boolean(record.is_available)} onChange={() => handleToggleAvailability(record)} />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <Card variant="borderless" style={{ borderRadius: 16, marginBottom: 16 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          <ShopOutlined style={{ color: '#ff6b35', marginRight: 8 }} />
          Quản lý cửa hàng của tôi
        </Title>
        <Text type="secondary">Xin chào {user?.username}, đây là nơi quản lý món ăn và đơn hàng của cửa hàng.</Text>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}><Card><Statistic title="Tổng đơn" value={stats.totalOrders} prefix={<ShoppingCartOutlined />} /></Card></Col>
          <Col xs={24} md={6}><Card><Statistic title="Đơn đang xử lý" value={stats.pendingOrders} /></Card></Col>
          <Col xs={24} md={6}><Card><Statistic title="Đơn hoàn thành" value={stats.completedOrders} prefix={<CheckCircleOutlined />} /></Card></Col>
          <Col xs={24} md={6}><Card><Statistic title="Số món đang bán" value={stats.totalFoods} /></Card></Col>
        </Row>
      </Card>

      <Card variant="borderless" style={{ borderRadius: 16, marginBottom: 16 }}>
        <Title level={4} style={{ marginTop: 0 }}>{store.name}</Title>
        <Text>{store.address}</Text><br />
        <Text type="secondary">Loại hình: {store.description || 'Cửa hàng ăn uống'}</Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Thêm danh mục" variant="borderless" style={{ borderRadius: 16 }}>
            <Form form={categoryForm} layout="vertical" onFinish={handleCreateCategory}>
              <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục' }]}>
                <Input placeholder="Ví dụ: Cơm tấm, Nước uống" />
              </Form.Item>
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Mô tả ngắn cho danh mục" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={submittingCategory}>Thêm danh mục</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Thêm món ăn" variant="borderless" style={{ borderRadius: 16 }}>
            <Form form={foodForm} layout="vertical" onFinish={handleCreateFood}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
                    <Select placeholder="Chọn danh mục">
                      {categories.map((category) => (
                        <Select.Option key={category.id} value={category.id}>{category.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="price" label="Giá bán" rules={[{ required: true, message: 'Nhập giá bán' }]}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="45000" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="name" label="Tên món" rules={[{ required: true, message: 'Nhập tên món' }]}>
                <Input placeholder="Ví dụ: Cơm tấm sườn bì chả" />
              </Form.Item>

              <Form.Item name="description" label="Mô tả món">
                <Input.TextArea rows={3} placeholder="Mô tả ngắn về món ăn" />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="preparationTime" label="Thời gian chuẩn bị (phút)">
                    <InputNumber min={1} style={{ width: '100%' }} placeholder="15" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Ảnh món ăn">
                    <Upload beforeUpload={() => false} maxCount={1} fileList={foodImageList} onChange={({ fileList }) => setFoodImageList(fileList)}>
                      <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              <Button type="primary" htmlType="submit" loading={submittingFood}>Thêm món ăn</Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách món ăn" variant="borderless" style={{ borderRadius: 16, marginTop: 16 }}>
        {foods.length === 0 ? <Empty description="Chưa có món ăn nào" /> : <Table rowKey="id" columns={foodColumns} dataSource={foods} pagination={{ pageSize: 6 }} />}
      </Card>

      <Card title="Đơn hàng của cửa hàng" variant="borderless" style={{ borderRadius: 16, marginTop: 16 }}>
        {orders.length === 0 ? <Empty description="Chưa có đơn hàng nào" /> : <Table rowKey="id" columns={orderColumns} dataSource={orders} scroll={{ x: 900 }} />}
      </Card>
    </div>
  );
}
