import React, { useState } from 'react';
import { Form, Input, Button, Tabs, message, Divider, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, ThunderboltOutlined, SafetyOutlined, GiftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import GoogleSignInButton from '../components/GoogleSignInButton';
import apiClient from '../services/apiClient';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setToken, setPending2FA } = useAuthStore();

  const onLogin = async (values) => {
    try {
      setLoading(true);
      const response = await apiClient.login(values.email, values.password);

      // Trường hợp cần xác thực 2FA
      if (response.requires_2fa) {
        // Lưu token tạm thời để gọi API verify 2FA
        setToken(response.token);
        setUser(response.user);
        setPending2FA(response.user.id);
        navigate('/verify-otp', {
          state: { userId: response.user.id, fromLogin: true },
        });
        return;
      }

      setToken(response.token);
      setUser(response.user);
      message.success('Đăng nhập thành công!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    try {
      setLoading(true);
      const response = await apiClient.register({
        username: values.username,
        email: values.email,
        password: values.password,
        phone: values.phone,
      });

      setToken(response.token);
      setUser(response.user);
      message.success('Đăng ký thành công!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff5f0 0%, #fff 50%, #fff8f0 100%)',
    }}>
      {/* ── LEFT PANEL (ẩn trên mobile) ── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #ff6b35 0%, #ff9a5c 60%, #ffb347 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
        className="login-left-panel"
      >
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', top: '40%', right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🍔</div>
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800, fontSize: 32 }}>
            SmartFood
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
            Đặt đồ ăn thông minh
          </Text>
        </div>

        {/* Feature list */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
          {[
            { icon: <ThunderboltOutlined />, title: 'Giao hàng siêu tốc', desc: 'Trung bình chỉ 25–35 phút' },
            { icon: <SafetyOutlined />,      title: 'An toàn & tin cậy',  desc: 'Quán ăn được kiểm duyệt kỹ' },
            { icon: <GiftOutlined />,        title: 'Ưu đãi mỗi ngày',   desc: 'Khuyến mãi cập nhật liên tục' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              marginBottom: 24, background: 'rgba(255,255,255,0.15)',
              borderRadius: 14, padding: '14px 16px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#fff', flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{f.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 32, marginTop: 16, position: 'relative',
        }}>
          {[{ v: '50+', l: 'Quán ăn' }, { v: '10K+', l: 'Đơn/tháng' }, { v: '4.9⭐', l: 'Đánh giá' }].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{s.v}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 40px',
        background: '#fff',
        boxShadow: '-4px 0 40px rgba(255,107,53,0.07)',
      }}>
        {/* Mobile logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="login-mobile-logo">
          <div style={{ fontSize: 48 }}>🍔</div>
          <Title level={3} style={{ color: '#ff6b35', margin: '4px 0 0', fontWeight: 800 }}>SmartFood</Title>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          tabBarStyle={{ marginBottom: 24 }}
          tabBarGutter={32}
          items={[
            {
              key: 'login',
              label: (
                <span style={{ fontWeight: 700, fontSize: 15 }}>Đăng nhập</span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0, color: '#1a1a1a' }}>Chào mừng trở lại! 👋</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Đăng nhập để tiếp tục đặt đồ ăn ngon</Text>
                  </div>

                  {/* Google */}
                  <GoogleSignInButton buttonText="Tiếp tục bằng Google" />

                  <Divider style={{ margin: '20px 0', color: '#bbb', fontSize: 12 }}>hoặc dùng email</Divider>

                  <Form onFinish={onLogin} layout="vertical" size="large">
                    <Form.Item
                      name="email"
                      label={<span style={{ fontWeight: 600, fontSize: 13 }}>Email</span>}
                      rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color: '#ff6b35' }} />}
                        placeholder="email@example.com"
                        style={{ borderRadius: 10, height: 44 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label={<span style={{ fontWeight: 600, fontSize: 13 }}>Mật khẩu</span>}
                      rules={[{ required: true, message: 'Nhập mật khẩu' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#ff6b35' }} />}
                        placeholder="Nhập mật khẩu"
                        style={{ borderRadius: 10, height: 44 }}
                      />
                    </Form.Item>

                    <Button
                      type="primary" htmlType="submit" block loading={loading}
                      style={{
                        height: 48, borderRadius: 24, fontSize: 15, fontWeight: 700,
                        background: 'linear-gradient(135deg, #ff6b35, #ff9a5c)',
                        border: 'none',
                        boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                        marginTop: 4,
                      }}
                    >
                      🍔 Đăng nhập
                    </Button>
                  </Form>

                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Chưa có tài khoản? </Text>
                    <Button
                      type="link" style={{ color: '#ff6b35', fontWeight: 700, padding: 0 }}
                      onClick={() => setActiveTab('register')}
                    >
                      Đăng ký ngay
                    </Button>
                  </div>
                </>
              ),
            },
            {
              key: 'register',
              label: (
                <span style={{ fontWeight: 700, fontSize: 15 }}>Đăng ký</span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0, color: '#1a1a1a' }}>Tạo tài khoản mới 🎉</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Tham gia SmartFood và đặt đồ ăn ngay hôm nay</Text>
                  </div>

                  <GoogleSignInButton buttonText="Đăng ký bằng Google" />

                  <Divider style={{ margin: '20px 0', color: '#bbb', fontSize: 12 }}>hoặc tạo tài khoản</Divider>

                  <Form onFinish={onRegister} layout="vertical" size="large">
                    <Form.Item
                      name="username"
                      label={<span style={{ fontWeight: 600, fontSize: 13 }}>Tên người dùng</span>}
                      rules={[{ required: true, message: 'Nhập tên người dùng' }]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: '#ff6b35' }} />}
                        placeholder="Tên của bạn"
                        style={{ borderRadius: 10, height: 44 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      label={<span style={{ fontWeight: 600, fontSize: 13 }}>Email</span>}
                      rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color: '#ff6b35' }} />}
                        placeholder="email@example.com"
                        style={{ borderRadius: 10, height: 44 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="phone"
                      label={<span style={{ fontWeight: 600, fontSize: 13 }}>Số điện thoại</span>}
                    >
                      <Input
                        prefix={<PhoneOutlined style={{ color: '#ff6b35' }} />}
                        placeholder="0901 234 567"
                        style={{ borderRadius: 10, height: 44 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label={<span style={{ fontWeight: 600, fontSize: 13 }}>Mật khẩu</span>}
                      rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#ff6b35' }} />}
                        placeholder="Tối thiểu 6 ký tự"
                        style={{ borderRadius: 10, height: 44 }}
                      />
                    </Form.Item>

                    <Button
                      type="primary" htmlType="submit" block loading={loading}
                      style={{
                        height: 48, borderRadius: 24, fontSize: 15, fontWeight: 700,
                        background: 'linear-gradient(135deg, #ff6b35, #ff9a5c)',
                        border: 'none',
                        boxShadow: '0 6px 20px rgba(255,107,53,0.35)',
                        marginTop: 4,
                      }}
                    >
                      🚀 Tạo tài khoản
                    </Button>
                  </Form>

                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Đã có tài khoản? </Text>
                    <Button
                      type="link" style={{ color: '#ff6b35', fontWeight: 700, padding: 0 }}
                      onClick={() => setActiveTab('login')}
                    >
                      Đăng nhập
                    </Button>
                  </div>
                </>
              ),
            },
          ]}
        />

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Text style={{ fontSize: 12, color: '#ccc' }}>
            © 2026 SmartFood · Thủ Đức, TP.HCM
          </Text>
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-mobile-logo { display: block !important; }
        }
        @media (min-width: 769px) {
          .login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
