import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { CheckCircleOutlined, ShopOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuthStore, useLocationStore } from '../store/useStore';

const { Title, Text, Paragraph } = Typography;

const statusColor = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
};

export default function StoreRegistrationPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { userLocation } = useLocationStore();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState(null);

  const loadRegistration = useCallback(async (notifyOnApproval = false) => {
    try {
      setLoading(true);
      const res = await apiClient.getMyStoreRegistration();
      setRegistration(res || null);

      if (res?.status === 'APPROVED') {
        const currentUser = await apiClient.getCurrentUser();
        if (currentUser?.role === 'store') {
          setUser(currentUser);
          if (notifyOnApproval || user?.role !== 'store') {
            message.success('Admin đã duyệt cửa hàng của bạn. Chuyển sang trang quản lý...');
            navigate('/store-dashboard', { replace: true });
          }
        }
      }
    } catch (error) {
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  }, [navigate, setUser, user?.role]);

  useEffect(() => {
    loadRegistration();
  }, [loadRegistration]);

  useEffect(() => {
    if (user?.role === 'store') return undefined;

    const timer = setInterval(() => {
      loadRegistration(true);
    }, 5000);

    return () => clearInterval(timer);
  }, [loadRegistration, user?.role]);

  useEffect(() => {
    form.setFieldsValue({
      phone: user?.phone || '',
      lat: userLocation?.lat,
      lng: userLocation?.lng,
    });
  }, [form, user?.phone, userLocation]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('storeName', values.storeName);
      formData.append('businessType', values.businessType);
      formData.append('address', values.address);
      formData.append('phone', values.phone || '');
      formData.append('lat', values.lat ?? userLocation?.lat ?? 10.8506);
      formData.append('lng', values.lng ?? userLocation?.lng ?? 106.7742);

      if (fileList[0]?.originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      await apiClient.submitStoreRegistration(formData);
      message.success('Đã gửi phiếu đăng ký cho admin');
      form.resetFields();
      setFileList([]);
      loadRegistration();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể gửi đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role === 'store') {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <Card variant="borderless" style={{ borderRadius: 16 }}>
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message="Tài khoản của bạn đã là cửa hàng bán hàng"
            description="Bạn có thể quản lý món ăn và xử lý đơn hàng ngay bây giờ."
            style={{ marginBottom: 20 }}
          />
          <Button type="primary" icon={<ShopOutlined />} onClick={() => navigate('/store-dashboard')}>
            Đi tới quản lý cửa hàng
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <Card variant="borderless" style={{ borderRadius: 16, marginBottom: 16 }} loading={loading}>
        <Title level={3} style={{ marginTop: 0 }}>
          <ShopOutlined style={{ color: '#ff6b35', marginRight: 8 }} />
          Đăng ký trở thành cửa hàng
        </Title>
        <Paragraph type="secondary">
          Gửi thông tin cửa hàng cho admin để xét duyệt. Khi được xác nhận, tài khoản của bạn sẽ tự động chuyển sang role `store`.
        </Paragraph>

        {registration && (
          <Descriptions
            title="Phiếu đăng ký gần nhất"
            bordered
            column={1}
            size="small"
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColor[registration.status] || 'default'}>{registration.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tên cửa hàng">{registration.store_name}</Descriptions.Item>
            <Descriptions.Item label="Loại hàng">{registration.business_type}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{registration.store_address}</Descriptions.Item>
            {registration.rejection_reason && (
              <Descriptions.Item label="Phản hồi admin">{registration.rejection_reason}</Descriptions.Item>
            )}
          </Descriptions>
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="storeName"
            label="Tên cửa hàng"
            rules={[{ required: true, message: 'Nhập tên cửa hàng' }]}
          >
            <Input placeholder="Ví dụ: Cơm Nhà Làm Cô Ba" />
          </Form.Item>

          <Form.Item
            name="businessType"
            label="Loại hàng sẽ bán"
            rules={[{ required: true, message: 'Nhập loại hàng' }]}
          >
            <Input placeholder="Ví dụ: Cơm văn phòng, đồ uống, món chay..." />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ cửa hàng"
            rules={[{ required: true, message: 'Nhập địa chỉ cửa hàng' }]}
          >
            <Input.TextArea rows={3} placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
          </Form.Item>

          <Space size={12} style={{ display: 'flex' }} align="start">
            <Form.Item name="phone" label="Số điện thoại" style={{ flex: 1 }}>
              <Input placeholder="0909xxxxxx" />
            </Form.Item>
            <Form.Item name="lat" label="Vĩ độ" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="10.85" />
            </Form.Item>
            <Form.Item name="lng" label="Kinh độ" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="106.77" />
            </Form.Item>
          </Space>

          <Form.Item label="Hình ảnh cửa hàng">
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList: nextList }) => setFileList(nextList)}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
            <Text type="secondary">Có thể để trống, nhưng nên thêm để admin dễ duyệt hơn.</Text>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            style={{ background: '#ff6b35', borderColor: '#ff6b35' }}
          >
            Gửi phiếu đăng ký
          </Button>
        </Form>
      </Card>
    </div>
  );
}
