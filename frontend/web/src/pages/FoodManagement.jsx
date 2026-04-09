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
  Upload,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import '../styles/Management.css';

const FoodManagement = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchFoods();
    fetchCategories();
    fetchStores();
  }, []);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/foods', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setFoods(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách foods');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCategories(response.data);
    } catch (error) {
      console.log('Lỗi khi tải categories');
    }
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/stores', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStores(response.data);
    } catch (error) {
      console.log('Lỗi khi tải stores');
    }
  };

  const handleAddFood = () => {
    setEditingFood(null);
    form.resetFields();
    setImageFile(null);
    setIsModalVisible(true);
  };

  const handleEditFood = (record) => {
    setEditingFood(record);
    form.setFieldsValue({
      name: record.name,
      category_id: record.category_id,
      store_id: record.store_id,
      price: record.price,
      is_hot: record.is_hot,
      status: record.is_active ? 'Active' : 'Inactive',
    });
    setIsModalVisible(true);
  };

  const handleSaveFood = async (values) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('category_id', values.category_id);
      formData.append('store_id', values.store_id);
      formData.append('price', values.price);
      formData.append('is_hot', values.is_hot);
      formData.append('status', values.status);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingFood) {
        await axios.put(`http://localhost:5000/api/admin/foods/${editingFood.id}`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Cập nhật food thành công!');
      } else {
        await axios.post('http://localhost:5000/api/admin/foods', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Thêm food thành công!');
      }
      setIsModalVisible(false);
      fetchFoods();
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  const handleDeleteFood = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/foods/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('Xóa food thành công!');
      fetchFoods();
    } catch (error) {
      message.error('Lỗi khi xóa food');
    }
  };

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Hình Ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image) => (
        <Image
          src={image}
          alt="food"
          style={{ width: 60, height: 60, objectFit: 'cover' }}
          preview={{ mask: <EyeOutlined /> }}
        />
      ),
    },
    {
      title: 'Tên Food',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Danh Mục',
      dataIndex: 'category',
      key: 'category',
      filters: [...new Set(foods.map((f) => f.category))].map((cat) => ({
        text: cat,
        value: cat,
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Cửa Hàng',
      dataIndex: 'store',
      key: 'store',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      sorter: (a, b) => a.price - b.price,
      render: (price) => `${price.toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <span style={{ color: '#faad14', fontWeight: 'bold' }}>⭐ {rating}</span>
      ),
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
      title: 'Hot',
      dataIndex: 'isHot',
      key: 'isHot',
      render: (isHot) => (
        <Tag color={isHot ? 'volcano' : 'default'}>
          {isHot ? '🔥 Hot' : 'Normal'}
        </Tag>
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
            onClick={() => handleEditFood(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa food này?"
            onConfirm={() => handleDeleteFood(record.id)}
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
      title="Quản Lý Foods"
      extra={
        <Space>
          <Input.Search
            placeholder="Tìm kiếm food..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFood}>
            Thêm Food
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredFoods}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          responsive
          scroll={{ x: 1000 }}
        />
      </Spin>

      {/* Modal */}
      <Modal
        title={editingFood ? 'Sửa Food' : 'Thêm Food Mới'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveFood}>
          <Form.Item
            name="name"
            label="Tên Food"
            rules={[{ required: true, message: 'Vui lòng nhập tên food' }]}
          >
            <Input placeholder="Nhập tên food" />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="Danh Mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục">
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="store_id"
            label="Cửa Hàng"
            rules={[{ required: true, message: 'Vui lòng chọn cửa hàng' }]}
          >
            <Select placeholder="Chọn cửa hàng">
              {stores.map((store) => (
                <Select.Option key={store.id} value={store.id}>
                  {store.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="price"
            label="Giá (VNĐ)"
            rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
          >
            <Input type="number" placeholder="Nhập giá" />
          </Form.Item>

          <Form.Item
            name="is_hot"
            label="Hot"
            rules={[{ required: true }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value={true}>Hot 🔥</Select.Option>
              <Select.Option value={false}>Normal</Select.Option>
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
            </Select>
          </Form.Item>

          <Form.Item label="Hình Ảnh">
            <Upload
              beforeUpload={(file) => {
                setImageFile(file);
                return false;
              }}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Chọn Hình Ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default FoodManagement;
