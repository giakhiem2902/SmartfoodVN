import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Popconfirm,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  ImageOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import '../styles/Management.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/categories', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCategories(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách categories');
    }
    setLoading(false);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    setImageFile(null);
    setIsModalVisible(true);
  };

  const handleEditCategory = (record) => {
    setEditingCategory(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      icon: record.icon,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  const handleSaveCategory = async (values) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('icon', values.icon);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingCategory) {
        await axios.put(`http://localhost:5000/api/admin/categories/${editingCategory.id}`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Cập nhật category thành công!');
      } else {
        await axios.post('http://localhost:5000/api/admin/categories', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success('Thêm category thành công!');
      }
      setIsModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('Xóa category thành công!');
      fetchCategories();
    } catch (error) {
      message.error('Lỗi khi xóa category');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Icon',
      dataIndex: 'icon',
      key: 'icon',
      width: 60,
      render: (icon) => <span style={{ fontSize: '24px' }}>{icon}</span>,
    },
    {
      title: 'Tên Category',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Mô Tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Foods',
      dataIndex: 'foods',
      key: 'foods',
      sorter: (a, b) => a.foods - b.foods,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <span style={{ color: status === 'Active' ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
          {status === 'Active' ? '✓ Active' : '✗ Inactive'}
        </span>
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
            onClick={() => handleEditCategory(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa category này?"
            onConfirm={() => handleDeleteCategory(record.id)}
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
      title="Quản Lý Categories"
      extra={
        <Space>
          <Input.Search
            placeholder="Tìm kiếm category..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}>
            Thêm Category
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          responsive
          scroll={{ x: 1000 }}
        />
      </Spin>

      {/* Modal */}
      <Modal
        title={editingCategory ? 'Sửa Category' : 'Thêm Category Mới'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveCategory}>
          <Form.Item
            name="name"
            label="Tên Category"
            rules={[{ required: true, message: 'Vui lòng nhập tên category' }]}
          >
            <Input placeholder="Nhập tên category" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô Tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập mô tả category"
            />
          </Form.Item>

          <Form.Item
            name="icon"
            label="Icon Emoji"
            rules={[{ required: true, message: 'Vui lòng nhập icon' }]}
          >
            <Input
              placeholder="Nhập emoji (ví dụ: 🍜)"
              maxLength={2}
            />
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

export default CategoryManagement;
