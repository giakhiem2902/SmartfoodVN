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
  Row,
  Col,
  Steps,
} from 'antd';
import { CheckCircleOutlined, ShopOutlined, UploadOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuthStore, useLocationStore } from '../store/useStore';
import LocationPicker from '../components/LocationPicker';

const { Title, Text, Paragraph } = Typography;

const PRIMARY = '#ff6b35';

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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');

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
      lat: selectedLocation?.lat ?? userLocation?.lat,
      lng: selectedLocation?.lng ?? userLocation?.lng,
    });
  }, [form, user?.phone, userLocation, selectedLocation]);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('storeName', values.storeName);
      formData.append('businessType', values.businessType);
      formData.append('address', values.address);
      formData.append('phone', values.phone || '');
      
      // Lấy tọa độ từ selected location hoặc form fields
      const lat = selectedLocation?.lat ?? values.lat ?? userLocation?.lat ?? 10.8506;
      const lng = selectedLocation?.lng ?? values.lng ?? userLocation?.lng ?? 106.7742;
      
      formData.append('lat', lat);
      formData.append('lng', lng);

      if (fileList[0]?.originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      await apiClient.submitStoreRegistration(formData);
      message.success('Đã gửi phiếu đăng ký cho admin');
      form.resetFields();
      setFileList([]);
      setSelectedLocation(null);
      loadRegistration();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể gửi đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationConfirm = (location, address) => {
    setSelectedLocation(location);
    setSelectedAddress(address);
    form.setFieldsValue({
      address: address || form.getFieldValue('address'),
      lat: location.lat,
      lng: location.lng,
    });
    setShowLocationPicker(false);
    message.success('Địa chỉ đã được cập nhật');
  };

  if (user?.role === 'store') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {/* Hero Header */}
        <div style={{
          background: `linear-gradient(135deg, ${PRIMARY}, #ff9a5c, #ffb347)`,
          padding: '40px 24px',
          color: '#fff',
          textAlign: 'center',
          borderRadius: '0 0 20px 20px',
        }}>
          <CheckCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <Title level={2} style={{ color: '#fff', margin: 0, marginTop: 8 }}>
            Cửa hàng của bạn đã được xác nhận
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8, marginBottom: 0 }}>
            Bạn có thể bắt đầu quản lý đơn hàng và cập nhật menu ngay bây giờ
          </Paragraph>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          <Card
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <Button
              type="primary"
              size="large"
              icon={<ShopOutlined />}
              onClick={() => navigate('/store-dashboard')}
              style={{
                background: PRIMARY,
                borderColor: PRIMARY,
                borderRadius: 8,
                height: 48,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Đi tới quản lý cửa hàng
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Hero Header */}
      <div style={{
        background: `linear-gradient(135deg, ${PRIMARY}, #ff9a5c, #ffb347)`,
        padding: '48px 24px',
        color: '#fff',
        borderRadius: '0 0 24px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <ShopOutlined style={{ fontSize: 32, marginRight: 12 }} />
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              Đăng ký trở thành cửa hàng
            </Title>
          </div>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 0, fontSize: 16 }}>
            Gửi thông tin cửa hàng để được xét duyệt. Khi được chấp thuận, bạn sẽ có quyền quản lý đơn hàng và menu
          </Paragraph>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <Row gutter={[24, 24]}>
          {/* Registration Form */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              bodyStyle={{ padding: '32px' }}
            >
              <Title level={4} style={{ marginTop: 0, marginBottom: 24, color: PRIMARY }}>
                Thông tin cửa hàng
              </Title>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  name="storeName"
                  label={<span style={{ fontWeight: 600 }}>Tên cửa hàng</span>}
                  rules={[{ required: true, message: 'Nhập tên cửa hàng' }]}
                >
                  <Input
                    placeholder="Ví dụ: Cơm Nhà Làm Cô Ba"
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item
                  name="businessType"
                  label={<span style={{ fontWeight: 600 }}>Loại hàng sẽ bán</span>}
                  rules={[{ required: true, message: 'Nhập loại hàng' }]}
                >
                  <Input
                    placeholder="Ví dụ: Cơm văn phòng, đồ uống, món chay..."
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item
                  name="address"
                  label={<span style={{ fontWeight: 600 }}>Địa chỉ cửa hàng</span>}
                  rules={[{ required: true, message: 'Nhập địa chỉ cửa hàng' }]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="phone" label={<span style={{ fontWeight: 600 }}>Số điện thoại</span>}>
                      <Input
                        placeholder="0909xxxxxx"
                        size="large"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Button
                      type="primary"
                      icon={<EnvironmentOutlined />}
                      onClick={() => setShowLocationPicker(true)}
                      size="large"
                      block
                      style={{
                        background: PRIMARY,
                        borderColor: PRIMARY,
                        borderRadius: 8,
                        marginTop: 32,
                      }}
                    >
                      {selectedLocation ? '✓ Chọn vị trí trên bản đồ' : 'Chọn vị trí trên bản đồ'}
                    </Button>
                  </Col>
                </Row>

                {selectedLocation && (
                  <div style={{
                    background: '#f0f5ff',
                    border: `1px solid ${PRIMARY}`,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16,
                  }}>
                    <Text strong style={{ color: PRIMARY }}>
                      ✓ Vị trí đã chọn:
                    </Text>
                    <div style={{ marginTop: 12 }}>
                      <Text block style={{ fontSize: 14, marginBottom: 8 }}>
                        <EnvironmentOutlined style={{ marginRight: 8, color: PRIMARY }} />
                        <span style={{ fontWeight: 600 }}>{selectedAddress}</span>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Tọa độ: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                      </Text>
                    </div>
                  </div>
                )}

                <Form.Item name="lat" hidden>
                  <InputNumber />
                </Form.Item>
                <Form.Item name="lng" hidden>
                  <InputNumber />
                </Form.Item>

                <Form.Item label={<span style={{ fontWeight: 600 }}>Hình ảnh cửa hàng</span>}>
                  <Upload
                    beforeUpload={() => false}
                    maxCount={1}
                    fileList={fileList}
                    onChange={({ fileList: nextList }) => setFileList(nextList)}
                    style={{ borderRadius: 8 }}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      size="large"
                      style={{ borderRadius: 8, width: '100%' }}
                    >
                      Chọn ảnh cửa hàng
                    </Button>
                  </Upload>
                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    Tùy chọn, nhưng nên thêm để admin dễ xác nhận hơn
                  </Text>
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  block
                  style={{
                    background: PRIMARY,
                    borderColor: PRIMARY,
                    borderRadius: 8,
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    marginTop: 24,
                  }}
                >
                  Gửi phiếu đăng ký
                </Button>
              </Form>
            </Card>
          </Col>

          {/* Status Card */}
          <Col xs={24} lg={8}>
            {registration ? (
              <Card
                style={{
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  background: statusColor[registration.status] === 'green' ? '#f6ffed' : '#fffbe6',
                  borderLeft: `4px solid ${statusColor[registration.status] === 'green' ? '#52c41a' : '#faad14'}`,
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
                  Phiếu đăng ký gần nhất
                </Title>
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>
                    Trạng thái
                  </Text>
                  <Tag
                    color={statusColor[registration.status]}
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {registration.status}
                  </Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>
                    Tên cửa hàng
                  </Text>
                  <Text strong>{registration.store_name}</Text>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>
                    Loại hàng
                  </Text>
                  <Text>{registration.business_type}</Text>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>
                    Địa chỉ
                  </Text>
                  <Text>{registration.store_address}</Text>
                </div>
                {registration.rejection_reason && (
                  <Alert
                    message="Phản hồi từ admin"
                    description={registration.rejection_reason}
                    type="error"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            ) : (
              <Card
                style={{
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  background: '#f0f5ff',
                  borderLeft: `4px solid ${PRIMARY}`,
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Title level={5} style={{ marginTop: 0, marginBottom: 12, color: PRIMARY }}>
                  Quy trình đăng ký
                </Title>
                <Steps
                  direction="vertical"
                  current={-1}
                  size="small"
                  items={[
                    {
                      title: 'Điền thông tin',
                      description: 'Nhập đầy đủ thông tin cửa hàng',
                    },
                    {
                      title: 'Gửi đơn',
                      description: 'Submit để xét duyệt',
                    },
                    {
                      title: 'Chờ xác nhận',
                      description: 'Admin sẽ phê duyệt trong 1-2 ngày',
                    },
                    {
                      title: 'Quản lý cửa hàng',
                      description: 'Bắt đầu quản lý đơn hàng',
                    },
                  ]}
                />
              </Card>
            )}
          </Col>
        </Row>

        {/* Location Picker Modal */}
        <LocationPicker
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onConfirm={handleLocationConfirm}
          initialLocation={selectedLocation || userLocation}
          initialAddress={form.getFieldValue('address')}
        />
      </div>
    </div>
  );
}
