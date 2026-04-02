import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, message, Space, Spin, QRCode as QRCodeComponent } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/useStore';

export default function TwoFactorAuthModal({ visible, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: BackupCodes
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [copied, setCopied] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Step 1: Generate 2FA Secret
  const handleGenerateSecret = async () => {
    setLoading(true);
    try {
      const response = await apiClient.twoFAGenerate();
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setStep(2);
    } catch (error) {
      message.error(error.response?.data?.error || 'Không thể tạo mã 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP và xác nhận bật 2FA
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      message.error('Mã OTP phải có đúng 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      // Xác nhận enable 2FA (confirm = verify + save)
      await apiClient.twoFAConfirm(secret, otp);

      // Lấy backup codes
      const backupResponse = await apiClient.twoFAGetBackupCodes();
      setBackupCodes(backupResponse.backup_codes);

      setStep(3);
    } catch (error) {
      message.error(error.response?.data?.error || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép backup codes!');
    setCopied(true);
  };

  // Finish 2FA Setup
  const handleFinish = () => {
    message.success('Bật 2FA thành công! Tài khoản của bạn đã được bảo vệ.');
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleReset = () => {
    setStep(1);
    setQrCode(null);
    setSecret(null);
    setOtp('');
    setBackupCodes([]);
    setCopied(false);
  };

  return (
    <Modal
      title="🔐 Cài đặt Xác thực 2 bước (2FA)"
      open={visible}
      onCancel={() => { handleReset(); onClose(); }}
      footer={null}
      width={500}
      centered
    >
      <Spin spinning={loading}>
        {/* Bước 1: Bắt đầu */}
        {step === 1 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3>Tăng cường bảo mật tài khoản</h3>
            <p style={{ color: '#666' }}>
              Xác thực 2 bước yêu cầu thêm mã từ điện thoại khi đăng nhập, giúp bảo vệ tài khoản ngay cả khi mật khẩu bị lộ.
            </p>
            <Button type="primary" size="large" onClick={handleGenerateSecret} loading={loading}>
              Bắt đầu cài đặt
            </Button>
          </div>
        )}

        {/* Bước 2: Scan QR */}
        {step === 2 && (
          <div style={{ padding: '10px' }}>
            <h4>Bước 1: Quét mã QR</h4>
            <p style={{ color: '#666' }}>Dùng Google Authenticator, Authy hoặc Microsoft Authenticator để quét:</p>

            {qrCode && (
              <div style={{ textAlign: 'center', margin: '16px 0', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '220px' }} />
              </div>
            )}

            <h4 style={{ marginTop: '16px' }}>Bước 2: Nhập thủ công (nếu không quét được)</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
              <code style={{ padding: '10px', backgroundColor: '#f0f0f0', flex: 1, wordBreak: 'break-all', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }}>
                {secret}
              </code>
              <CopyOutlined
                onClick={() => { navigator.clipboard.writeText(secret || ''); message.success('Đã sao chép!'); }}
                style={{ cursor: 'pointer', fontSize: '18px', color: '#1890ff' }}
              />
            </div>

            <h4 style={{ marginTop: '16px' }}>Bước 3: Nhập mã OTP để xác nhận</h4>
            <Input
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              size="large"
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '22px', fontWeight: 'bold' }}
              onPressEnter={handleVerifyOTP}
            />

            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <Button onClick={() => setStep(1)} style={{ flex: 1 }}>Quay lại</Button>
              <Button type="primary" onClick={handleVerifyOTP} loading={loading} disabled={otp.length !== 6} style={{ flex: 1 }}>
                Xác nhận & Bật 2FA
              </Button>
            </div>
          </div>
        )}

        {/* Bước 3: Backup Codes */}
        {step === 3 && (
          <div style={{ padding: '10px' }}>
            <h4>⚠️ Lưu Backup Codes của bạn</h4>
            <p style={{ color: '#888' }}>
              Lưu các mã này ở nơi an toàn. Dùng khi mất điện thoại hoặc không truy cập được app xác thực. <strong>Mỗi mã chỉ dùng 1 lần.</strong>
            </p>

            <div style={{ backgroundColor: '#fff9e6', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ffc069' }}>
              {backupCodes.map((code, index) => (
                <div key={index} style={{ fontSize: '14px', fontFamily: 'monospace', marginBottom: '6px' }}>
                  {index + 1}. <strong>{code}</strong>
                </div>
              ))}
            </div>

            <Button
              onClick={handleCopyBackupCodes}
              block
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              style={{ marginBottom: '12px' }}
            >
              {copied ? 'Đã sao chép!' : 'Sao chép tất cả'}
            </Button>

            <Button type="primary" onClick={handleFinish} block size="large">
              ✅ Hoàn tất - Tôi đã lưu các mã
            </Button>
          </div>
        )}
      </Spin>
    </Modal>
  );
}
