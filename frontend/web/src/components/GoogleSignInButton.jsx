import React from 'react';
import { Button, message } from 'antd';
import { GoogleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/useStore';

export default function GoogleSignInButton({ buttonText = 'Đăng nhập bằng Google' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const { setUser, setToken, setPending2FA } = useAuthStore();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      // Gửi access_token lên backend /api/google/verify
      // apiClient trả về data trực tiếp (không có wrapper .data)
      const res = await apiClient.googleVerify(credentialResponse.access_token);

      setToken(res.token);
      setUser(res.user);

      // Nếu user có bật 2FA → chuyển sang trang xác thực OTP
      if (res.requiresOTP || res.user?.two_factor_enabled) {
        setPending2FA(res.user.id);
        navigate('/verify-otp', {
          state: { userId: res.user.id, fromGoogle: true },
        });
      } else {
        message.success(`Chào mừng, ${res.user.username}!`);
        navigate('/');
      }
    } catch (error) {
      console.error('Google login error:', error);
      message.error(error.response?.data?.error || error.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => message.error('Google đăng nhập thất bại'),
  });

  return (
    <Button
      size="large"
      icon={loading ? <LoadingOutlined /> : <GoogleOutlined />}
      onClick={() => login()}
      block
      disabled={loading}
      style={{
        borderColor: '#4285F4',
        color: '#4285F4',
        fontWeight: 600,
        height: '42px',
      }}
    >
      {loading ? 'Đang xử lý...' : buttonText}
    </Button>
  );
}
