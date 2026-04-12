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
  Popconfirm,
  Upload,
  Alert,
  Divider,
  Tag,
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
import apiClient from '../services/apiClient';
import '../styles/Management.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [storeCategoriesLoading, setStoreCategoriesLoading] = useState(false);
  const [storeCategoriesList, setStoreCategoriesList] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setStoresLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/stores', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      message.error('Lỗi khi tải danh sách stores');
    }
    setStoresLoading(false);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminCategories();
      setCategories(response);
    } catch (error) {
      message.error('Lỗi khi tải danh sách categories');
    }
    setLoading(false);
  };

  const fetchStoreCategoriesById = async (storeId) => {
    if (!storeId) {
      setStoreCategoriesList([]);
      return;
    }

    setStoreCategoriesLoading(true);
    try {
      const response = await apiClient.getAdminCategoriesByStore(storeId);
      setStoreCategoriesList(response);
    } catch (error) {
      console.error('Error fetching store categories:', error);
      setStoreCategoriesList([]);
    }
    setStoreCategoriesLoading(false);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setSelectedStoreId(null);
    setStoreCategoriesList([]);
    form.resetFields();
    setImageFile(null);
    setIsModalVisible(true);
  };

  const handleEditCategory = (record) => {
    setEditingCategory(record);
    setSelectedStoreId(record.store_id);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      store_id: record.store_id,
    });
    fetchStoreCategoriesById(record.store_id);
    setIsModalVisible(true);
  };

  const handleStoreChange = (storeId) => {
    setSelectedStoreId(storeId);
    form.setFieldsValue({ store_id: storeId });
    fetchStoreCategoriesById(storeId);
  };

  const handleSaveCategory = async (values) => {
    try {
      if (!selectedStoreId) {
        message.error('Vui lòng chọn store');
        return;
      }

      const payload = {
        name: values.name,
        description: values.description,
        store_id: selectedStoreId,
      };

      if (editingCategory) {
        await axios.put(`http://localhost:5000/api/admin/categories/${editingCategory.id}`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        message.success('Cập nhật category thành công!');
      } else {
        await axios.post('http://localhost:5000/api/admin/categories', payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        message.success('Thêm category thành công!');
      }
      setIsModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      message.error('Lỗi: ' + (error.response?.data?.error || error.message));
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
      title: 'Store',
      dataIndex: 'store_id',
      key: 'store_id',
      render: (storeId) => {
        const store = stores.find(s => s.id === storeId);
        return store ? <span>{store.name}</span> : <span>-</span>;
      },
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
          scroll={{ x: 1200 }}
        />
      </Spin>

      {/* Modal */}
      <Modal
        title={editingCategory ? 'Sửa Category' : 'Thêm Category Mới'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        <Spin spinning={storesLoading}>
          <Form form={form} layout="vertical" onFinish={handleSaveCategory}>
            <Form.Item
              name="store_id"
              label="Chọn Store"
              rules={[{ required: true, message: 'Vui lòng chọn store' }]}
            >
              <Select
                placeholder="Chọn store"
                onChange={handleStoreChange}
                loading={storesLoading}
              >
                {stores.map((store) => (
                  <Select.Option key={store.id} value={store.id}>
                    {store.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {selectedStoreId && (
              <>
                <Divider />
                <div style={{ marginBottom: 16 }}>
                  <strong>Danh Mục Hiện Có Của Store Này:</strong>
                  <Spin spinning={storeCategoriesLoading} style={{ marginTop: 12 }}>
                    {storeCategoriesList.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                        {storeCategoriesList.map((cat) => (
                          <Tag key={cat.id} color="blue">
                            {cat.name}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <Alert
                        message="Store này chưa có danh mục nào"
                        type="info"
                        showIcon
                        style={{ marginTop: 12 }}
                      />
                    )}
                  </Spin>
                </div>
                <Divider />
              </>
            )}

            <Form.Item
              name="name"
              label="Tên Category"
              rules={[{ required: true, message: 'Vui lòng nhập tên category' }]}
            >
              <Input placeholder="Nhập tên category (tránh trùng với danh sách trên)" />
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
          </Form>
        </Spin>
      </Modal>
    </Card>
  );
};

export default CategoryManagement;
