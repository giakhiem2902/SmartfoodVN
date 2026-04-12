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
  Tabs,
  Alert,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import apiClient from '../services/apiClient';
import '../styles/Management.css';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchRegistrationText, setSearchRegistrationText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [reviewingRegistration, setReviewingRegistration] = useState(null);
  const [reviewForm] = Form.useForm();
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchStores();
    fetchRegistrations();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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

  const fetchRegistrations = async () => {
    setRegistrationsLoading(true);
    try {
      const response = await apiClient.getAdminStoreRegistrations();
      setRegistrations(response);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      message.error('Lỗi khi tải danh sách phiếu đăng ký');
    }
    setRegistrationsLoading(false);
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
      owner_id: record.owner_id,
      phone: record.phone,
      address: record.address,
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
        // For new stores, convert owner to owner_id if needed
        const payload = {
          ...values,
          owner_id: values.owner_id || values.owner,
        };
        delete payload.owner;
        
        await axios.post('http://localhost:5000/api/admin/stores', payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        message.success('Thêm store thành công!');
      }
      setIsModalVisible(false);
      fetchStores();
    } catch (error) {
      console.error('Error saving store:', error.response?.data || error.message);
      message.error('Lỗi: ' + (error.response?.data?.error || error.message));
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

  const handleReviewRegistration = (record) => {
    setReviewingRegistration(record);
    setReviewStatus('APPROVED');
    setRejectionReason('');
    reviewForm.resetFields();
    setIsReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    try {
      await apiClient.updateAdminStoreRegistration(reviewingRegistration.id, {
        status: reviewStatus,
        rejectionReason: reviewStatus === 'REJECTED' ? rejectionReason : null,
      });
      
      message.success(`Phiếu đã được ${reviewStatus === 'APPROVED' ? 'duyệt' : 'từ chối'}!`);
      setIsReviewModalVisible(false);
      fetchRegistrations();
      // Also refresh stores if approved
      if (reviewStatus === 'APPROVED') {
        fetchStores();
      }
    } catch (error) {
      message.error('Lỗi khi xử lý phiếu đăng ký');
      console.error('Error:', error);
    }
  };

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchText.toLowerCase()) ||
      store.owner.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredRegistrations = registrations.filter(
    (reg) =>
      reg.storeName.toLowerCase().includes(searchRegistrationText.toLowerCase()) ||
      reg.applicantName.toLowerCase().includes(searchRegistrationText.toLowerCase())
  );

  const storeColumns = [
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

  const registrationColumns = [
    {
      title: 'Tên Store',
      dataIndex: 'storeName',
      key: 'storeName',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Người Đăng Ký',
      dataIndex: 'applicantName',
      key: 'applicantName',
    },
    {
      title: 'Email',
      dataIndex: 'applicantEmail',
      key: 'applicantEmail',
    },
    {
      title: 'Loại Hàng',
      dataIndex: 'businessType',
      key: 'businessType',
    },
    {
      title: 'Địa Chỉ',
      dataIndex: 'address',
      key: 'address',
      render: (text) => (
        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        let label = status;
        if (status === 'APPROVED') {
          color = 'green';
          label = 'Đã Duyệt';
        } else if (status === 'REJECTED') {
          color = 'red';
          label = 'Bị Từ Chối';
        } else if (status === 'PENDING') {
          label = 'Chờ Duyệt';
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Ngày Gửi',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành Động',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleReviewRegistration(record)}
          disabled={record.status !== 'PENDING'}
        >
          Xem Xét
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'stores',
      label: 'Quản Lý Stores',
      children: (
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
              columns={storeColumns}
              dataSource={filteredStores}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              responsive
              scroll={{ x: 1400 }}
            />
          </Spin>
        </Card>
      ),
    },
    {
      key: 'registrations',
      label: `Phiếu Đăng Ký (${registrations.filter(r => r.status === 'PENDING').length})`,
      children: (
        <Card
          title="Phiếu Đăng Ký Mở Store"
          extra={
            <Input.Search
              placeholder="Tìm kiếm phiếu..."
              allowClear
              onChange={(e) => setSearchRegistrationText(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
          }
        >
          <Spin spinning={registrationsLoading}>
            {registrations.length === 0 ? (
              <Alert
                message="Không có phiếu đăng ký"
                description="Chưa có user nào đăng ký mở store"
                type="info"
                showIcon
              />
            ) : (
              <Table
                columns={registrationColumns}
                dataSource={filteredRegistrations}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                responsive
                scroll={{ x: 1200 }}
              />
            )}
          </Spin>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Tabs items={tabItems} defaultActiveKey="stores" />

      {/* Store Modal */}
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
            name="owner_id"
            label="Chủ Sở Hữu"
            rules={[{ required: true, message: 'Vui lòng chọn chủ sở hữu' }]}
          >
            <Select placeholder="Chọn chủ sở hữu">
              {users.filter(u => u.role === 'Store Owner').map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số Điện Thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Nhập số điện thoại" prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa Chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input placeholder="Nhập địa chỉ" prefix={<EnvironmentOutlined />} />
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

      {/* Review Registration Modal */}
      <Modal
        title="Xem Xét Phiếu Đăng Ký"
        open={isReviewModalVisible}
        onOk={handleSubmitReview}
        onCancel={() => setIsReviewModalVisible(false)}
        width={800}
        okText={reviewStatus === 'APPROVED' ? 'Duyệt' : 'Từ Chối'}
        okButtonProps={{
          danger: reviewStatus === 'REJECTED',
        }}
      >
        {reviewingRegistration && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h3>Thông Tin Phiếu Đăng Ký</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <strong>Tên Store:</strong>
                  <div>{reviewingRegistration.storeName}</div>
                </div>
                <div>
                  <strong>Loại Hàng:</strong>
                  <div>{reviewingRegistration.businessType}</div>
                </div>
                <div>
                  <strong>Người Đăng Ký:</strong>
                  <div>{reviewingRegistration.applicantName}</div>
                </div>
                <div>
                  <strong>Email:</strong>
                  <div>{reviewingRegistration.applicantEmail}</div>
                </div>
                <div>
                  <strong>Số Điện Thoại:</strong>
                  <div>{reviewingRegistration.applicantPhone}</div>
                </div>
                <div>
                  <strong>SDT Store:</strong>
                  <div>{reviewingRegistration.phone}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Địa Chỉ:</strong>
                  <div>{reviewingRegistration.address}</div>
                </div>
              </div>
              {reviewingRegistration.image && (
                <div style={{ marginTop: 16 }}>
                  <strong>Ảnh Cửa Hàng:</strong>
                  <div style={{ marginTop: 8 }}>
                    <Image
                      src={`http://localhost:5000${reviewingRegistration.image}`}
                      alt="Store"
                      style={{ maxWidth: 200, maxHeight: 150 }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
              <h3>Quyết Định</h3>
              <Form
                layout="vertical"
                form={reviewForm}
                initialValues={{ status: 'APPROVED' }}
              >
                <Form.Item label="Quyết Định">
                  <Select
                    value={reviewStatus}
                    onChange={(value) => {
                      setReviewStatus(value);
                      if (value === 'REJECTED') {
                        setRejectionReason('');
                      }
                    }}
                  >
                    <Select.Option value="APPROVED">
                      <CheckOutlined style={{ color: 'green' }} /> Duyệt
                    </Select.Option>
                    <Select.Option value="REJECTED">
                      <CloseOutlined style={{ color: 'red' }} /> Từ Chối
                    </Select.Option>
                  </Select>
                </Form.Item>

                {reviewStatus === 'REJECTED' && (
                  <Form.Item label="Lý Do Từ Chối">
                    <Input.TextArea
                      rows={3}
                      placeholder="Nhập lý do từ chối..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </Form.Item>
                )}
              </Form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StoreManagement;
