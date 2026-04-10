import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Space,
  Divider,
  message,
  Row,
  Col,
  Tabs,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  UserOutlined,
  SettingOutlined,
  SafetyOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import '../styles/Management.css';

const Settings = () => {
  const [form] = Form.useForm();
  const [generalForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSaveSettings = async (values) => {
    setLoading(true);
    try {
      await axios.put('http://localhost:5000/api/admin/settings', values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      message.success('Cài đặt đã được lưu thành công!');
    } catch (error) {
      message.error('Lỗi khi lưu cài đặt');
    }
    setLoading(false);
  };

  const generalSettings = (
    <Card>
      <Form
        form={generalForm}
        layout="vertical"
        onFinish={(values) => handleSaveSettings(values)}
        initialValues={{
          appName: 'SmartFood',
          tagline: 'Real-time Food Delivery Platform',
          language: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          emailNotification: true,
          smsNotification: false,
        }}
      >
        <Form.Item
          label="Tên Ứng Dụng"
          name="appName"
          rules={[{ required: true, message: 'Vui lòng nhập tên ứng dụng' }]}
        >
          <Input placeholder="Nhập tên ứng dụng" />
        </Form.Item>

        <Form.Item
          label="Tagline"
          name="tagline"
          rules={[{ required: true }]}
        >
          <Input placeholder="Nhập tagline" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Ngôn Ngữ"
              name="language"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: 'Tiếng Việt', value: 'vi' },
                  { label: 'English', value: 'en' },
                  { label: 'Tiếng Trung', value: 'zh' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Timezone"
              name="timezone"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: 'Asia/Ho_Chi_Minh (GMT+7)', value: 'Asia/Ho_Chi_Minh' },
                  { label: 'Asia/Bangkok (GMT+7)', value: 'Asia/Bangkok' },
                  { label: 'Asia/Singapore (GMT+8)', value: 'Asia/Singapore' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Thông Báo</Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Email Notification"
              name="emailNotification"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="SMS Notification"
              name="smsNotification"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              Lưu Cài Đặt
            </Button>
            <Button icon={<ReloadOutlined />}>
              Đặt Lại Mặc Định
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  const securitySettings = (
    <Card>
      <Form
        form={securityForm}
        layout="vertical"
        onFinish={(values) => handleSaveSettings(values)}
        initialValues={{
          twoFactorAuth: true,
          passwordExpire: 90,
          sessionTimeout: 30,
          ipWhitelist: false,
          requireHttps: true,
        }}
      >
        <Form.Item
          label="Two-Factor Authentication"
          name="twoFactorAuth"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Mật Khẩu Hết Hạn Sau (Ngày)"
          name="passwordExpire"
          rules={[{ required: true }]}
        >
          <InputNumber min={0} max={365} />
        </Form.Item>

        <Form.Item
          label="Timeout Phiên (Phút)"
          name="sessionTimeout"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={1440} />
        </Form.Item>

        <Form.Item
          label="IP Whitelist"
          name="ipWhitelist"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Yêu Cầu HTTPS"
          name="requireHttps"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider>Quản Lý Mật Khẩu Admin</Divider>

        <Form.Item
          label="Mật Khẩu Hiện Tại"
          name="currentPassword"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
        >
          <Input.Password placeholder="Nhập mật khẩu hiện tại" />
        </Form.Item>

        <Form.Item
          label="Mật Khẩu Mới"
          name="newPassword"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
        >
          <Input.Password placeholder="Nhập mật khẩu mới" />
        </Form.Item>

        <Form.Item
          label="Xác Nhận Mật Khẩu"
          name="confirmPassword"
          rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
        >
          <Input.Password placeholder="Xác nhận mật khẩu mới" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              Cập Nhật Cài Đặt Bảo Mật
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  const themeSettings = (
    <Card>
      <Form
        layout="vertical"
        initialValues={{
          theme: 'light',
          primaryColor: '#667eea',
          compactMode: false,
        }}
      >
        <Form.Item
          label="Chủ Đề"
          name="theme"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: 'Sáng (Light)', value: 'light' },
              { label: 'Tối (Dark)', value: 'dark' },
              { label: 'Tự Động', value: 'auto' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Màu Sắc Chính"
          name="primaryColor"
        >
          <Input type="color" style={{ width: '100px' }} />
        </Form.Item>

        <Form.Item
          label="Chế Độ Compact"
          name="compactMode"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" icon={<SaveOutlined />}>
            Lưu Chủ Đề
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const tabs = [
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined />
          Cài Đặt Chung
        </span>
      ),
      children: generalSettings,
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyOutlined />
          Bảo Mật
        </span>
      ),
      children: securitySettings,
    },
    {
      key: 'theme',
      label: (
        <span>
          <BgColorsOutlined />
          Giao Diện
        </span>
      ),
      children: themeSettings,
    },
  ];

  return (
    <div className="management-container">
      <Card title="Cài Đặt Hệ Thống" style={{ marginBottom: '24px' }}>
        <Tabs items={tabs} />
      </Card>

      {/* System Info */}
      <Card title="Thông Tin Hệ Thống">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: '16px', backgroundColor: '#f5f7fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>Version</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>v1.0.0</p>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: '16px', backgroundColor: '#f5f7fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>Database</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>MySQL</p>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: '16px', backgroundColor: '#f5f7fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>Server</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Node.js</p>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ padding: '16px', backgroundColor: '#f5f7fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>Status</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                Online
              </p>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Settings;
