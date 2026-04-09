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
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import '../styles/Management.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Không tìm thấy token. Vui lòng đăng nhập lại!');
        setLoading(false);
        return;
      }
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      message.error(error.response?.data?.message || 'Lỗi khi tải danh sách users');
    }
    setLoading(false);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      role: record.role,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  const handleSaveUser = async (values) => {
    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/admin/users/${editingUser.id}`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        message.success('Cập nhật user thành công!');
      } else {
        await axios.post('http://localhost:5000/api/admin/users', values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        message.success('Thêm user thành công!');
      }
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('Xóa user thành công!');
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi xóa user');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'name',
      key: 'avatar',
      width: 50,
      render: (name) => (
        <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
      ),
    },
    {
      title: 'Tên User',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Customer', value: 'Customer' },
        { text: 'Driver', value: 'Driver' },
        { text: 'Store Owner', value: 'Store Owner' },
        { text: 'Admin', value: 'Admin' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => {
        const colors = {
          Customer: 'blue',
          Driver: 'green',
          'Store Owner': 'orange',
          Admin: 'red',
        };
        return <Tag color={colors[role] || 'default'}>{role}</Tag>;
      },
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
      title: 'Ngày Tham Gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
      sorter: (a, b) => new Date(a.joinDate) - new Date(b.joinDate),
    },
    {
      title: 'Đơn Hàng',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a, b) => a.orders - b.orders,
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
            onClick={() => handleEditUser(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa user này?"
            onConfirm={() => handleDeleteUser(record.id)}
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
      title="Quản Lý Users"
      extra={
        <Space>
          <Input.Search
            placeholder="Tìm kiếm user..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
            Thêm User
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          responsive
          scroll={{ x: 1200 }}
        />
      </Spin>

      {/* Modal */}
      <Modal
        title={editingUser ? 'Sửa User' : 'Thêm User Mới'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveUser}>
          <Form.Item
            name="name"
            label="Tên User"
            rules={[{ required: true, message: 'Vui lòng nhập tên user' }]}
          >
            <Input placeholder="Nhập tên user" />
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
            name="phone"
            label="Số Điện Thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Vui lòng chọn role' }]}
          >
            <Select placeholder="Chọn role">
              <Select.Option value="Customer">Customer</Select.Option>
              <Select.Option value="Driver">Driver</Select.Option>
              <Select.Option value="Store Owner">Store Owner</Select.Option>
              <Select.Option value="Admin">Admin</Select.Option>
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
              <Select.Option value="Banned">Banned</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
