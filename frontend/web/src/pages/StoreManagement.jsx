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
  InputNumber,
  Map,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import '../styles/Management.css';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/stores', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStores(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách stores');
    }
    setLoading(false);
  };

  const handleAddStore = () => {
    setEditingStore(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditStore = (record) => {
    setEditingStore(record);
    form.setFieldsValue({
      name: record.name,
      owner: record.owner,
      phone: record.phone,
      email: record.email,
      address: record.address,
      city: record.city,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  const handleSaveStore = async (values) => {
    try {
      if (editingStore) {
        await axios.put(`http://localhost:5000/api/admin/stores/${editingStore.id}`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        message.success('Cập nhật store thành công!');
      } else {
        await axios.post('http://localhost:5000/api/admin/stores', values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        message.success('Thêm store thành công!');
      }
      setIsModalVisible(false);
      fetchStores();
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  const handleDeleteStore = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/stores/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('Xóa store thành công!');
      fetchStores();
    } catch (error) {
      message.error('Lỗi khi xóa store');
    }
  };

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchText.toLowerCase()) ||
      store.owner.toLowerCase().includes(searchText.toLowerCase()) ||
      store.city.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Tên Store',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name) => <strong>{name}</strong>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Chủ Sở Hữu',
      dataIndex: 'owner',
      key: 'owner',
      width: 130,
    },
    {
      title: 'Thành Phố',
      dataIndex: 'city',
      key: 'city',
      filters: [
        { text: 'TPHCM', value: 'TPHCM' },
        { text: 'Hà Nội', value: 'Hà Nội' },
        { text: 'Đà Nẵng', value: 'Đà Nẵng' },
      ],
      onFilter: (value, record) => record.city === value,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      sorter: (a, b) => a.rating - b.rating,
      render: (rating) => (
        <span style={{ color: '#faad14', fontWeight: 'bold' }}>⭐ {rating}</span>
      ),
    },
    {
      title: 'Reviews',
      dataIndex: 'reviews',
      key: 'reviews',
      sorter: (a, b) => a.reviews - b.reviews,
    },
    {
      title: 'Foods',
      dataIndex: 'foods',
      key: 'foods',
    },
    {
      title: 'Giao Hàng',
      dataIndex: 'avgDelivery',
      key: 'avgDelivery',
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Hành Động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditStore(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa store này?"
            onConfirm={() => handleDeleteStore(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Quản Lý Stores"
      extra={
        <Space>
          <Input.Search
            placeholder="Tìm kiếm store..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStore}>
            Thêm Store
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredStores}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          responsive
          scroll={{ x: 1400 }}
        />
      </Spin>

      {/* Modal */}
      <Modal
        title={editingStore ? 'Sửa Store' : 'Thêm Store Mới'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveStore}>
          <Form.Item
            name="name"
            label="Tên Store"
            rules={[{ required: true, message: 'Vui lòng nhập tên store' }]}
          >
            <Input placeholder="Nhập tên store" />
          </Form.Item>

          <Form.Item
            name="owner"
            label="Chủ Sở Hữu"
            rules={[{ required: true, message: 'Vui lòng nhập tên chủ sở hữu' }]}
          >
            <Input placeholder="Nhập tên chủ sở hữu" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số Điện Thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Nhập số điện thoại" prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa Chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input placeholder="Nhập địa chỉ" prefix={<EnvironmentOutlined />} />
          </Form.Item>

          <Form.Item
            name="city"
            label="Thành Phố"
            rules={[{ required: true, message: 'Vui lòng chọn thành phố' }]}
          >
            <Select placeholder="Chọn thành phố">
              <Select.Option value="TPHCM">TPHCM</Select.Option>
              <Select.Option value="Hà Nội">Hà Nội</Select.Option>
              <Select.Option value="Đà Nẵng">Đà Nẵng</Select.Option>
              <Select.Option value="Hải Phòng">Hải Phòng</Select.Option>
              <Select.Option value="Cần Thơ">Cần Thơ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng Thái"
            rules={[{ required: true }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="Active">Active</Select.Option>
              <Select.Option value="Inactive">Inactive</Select.Option>
              <Select.Option value="Pending">Pending</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default StoreManagement;
