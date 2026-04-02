import React, { useState } from 'react';
import { Card, Button, Input, Space, message, Alert, Tabs } from 'antd';
import { SafetyOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/useStore';

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken, clearPending2FA, pendingUserId } = useAuthStore();

  const userId = location.state?.userId || pendingUserId;

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      message.error('Vui lòng nhập đúng 6 chữ số');
      return;
    }
    setLoading(true);
    try {
      await apiClient.twoFAVerify(otp);
      clearPending2FA();
      message.success('Xác thực thành công!');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.error || 'Mã OTP không hợp lệ, thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackupCode = async () => {
    if (!backupCode.trim()) {
      message.error('Vui lòng nhập backup code');
      return;
    }
    if (!userId) {
      message.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      navigate('/');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.twoFAVerifyBackupCode(userId, backupCode.trim());
      // Backup code login trả về token mới
      setToken(res.token);
      setUser(res.user);
      clearPending2FA();
      message.success(`Đăng nhập thành công! Còn ${res.remaining_codes} backup codes.`);
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.error || 'Backup code không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: '100%', maxWidth: '420px', borderRadius: '12px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <SafetyOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          <h2 style={{ marginTop: '12px' }}>Xác thực 2 bước</h2>
        </div>

        <Tabs
          centered
          items={[
            {
              key: 'otp',
              label: '📱 Mã OTP',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Alert
                    message="Nhập mã 6 chữ số từ ứng dụng xác thực (Google Authenticator, Authy…)"
                    type="info"
                    showIcon
                  />
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    size="large"
                    style={{
                      textAlign: 'center',
                      letterSpacing: '12px',
                      fontSize: '28px',
                      fontWeight: 'bold',
                    }}
                    onPressEnter={handleVerifyOTP}
                  />
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleVerifyOTP}
                    loading={loading}
                    disabled={otp.length !== 6}
                    block
                  >
                    Xác nhận OTP
                  </Button>
                </Space>
              ),
            },
            {
              key: 'backup',
              label: '🔑 Backup Code',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Alert
                    message="Dùng một trong các backup codes đã lưu khi cài đặt 2FA. Mỗi code chỉ dùng được 1 lần."
                    type="warning"
                    showIcon
                  />
                  <Input
                    prefix={<KeyOutlined />}
                    placeholder="Nhập backup code (vd: A1B2C3D4)"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                    size="large"
                    style={{ textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                    onPressEnter={handleVerifyBackupCode}
                  />
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleVerifyBackupCode}
                    loading={loading}
                    disabled={!backupCode.trim()}
                    block
                    danger
                  >
                    Đăng nhập bằng Backup Code
                  </Button>
                  <p style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>
                    ⚠️ Sau khi dùng, code này sẽ bị xóa vĩnh viễn
                  </p>
                </Space>
              ),
            },
          ]}
        />

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button type="link" onClick={() => navigate('/')}>
            ← Quay lại đăng nhập
          </Button>
        </div>
      </Card>
    </div>
  );
}
