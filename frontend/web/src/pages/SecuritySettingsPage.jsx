import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Switch, Divider, Modal, Input, message, Spin, Alert } from 'antd';
import { GoogleOutlined, SafetyOutlined } from '@ant-design/icons';
import TwoFactorAuthModal from '../components/TwoFactorAuthModal';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/useStore';

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [disableOTP, setDisableOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Check 2FA status on mount
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await apiClient.twoFAStatus();
      setTwoFactorEnabled(response.two_factor_enabled);
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableOTP || disableOTP.length !== 6) {
      message.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await apiClient.twoFADisable(disableOTP);

      message.success('2FA has been disabled');
      setTwoFactorEnabled(false);
      setDisableOTP('');
      setDisableModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (checked) => {
    if (checked && !twoFactorEnabled) {
      // Enable 2FA
      setSetupModalVisible(true);
    } else if (!checked && twoFactorEnabled) {
      // Disable 2FA - require OTP first
      setDisableModalVisible(true);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>🔐 Security Settings</h1>

      <Card style={{ marginTop: '20px' }}>
        <h3>Account Security</h3>
        <Divider />

        {/* Google Account Linking */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>
                <GoogleOutlined /> Google Account
              </h4>
              <p style={{ color: '#666', marginBottom: 0 }}>
                {user?.google_id 
                  ? '✓ Connected to your account' 
                  : 'Link your Google account for easier login'}
              </p>
            </div>
            {!user?.google_id && (
              <Button type="primary">
                <GoogleOutlined /> Link Google
              </Button>
            )}
          </div>
        </div>

        <Divider />

        {/* Two-Factor Authentication */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>
                <SafetyOutlined /> Two-Factor Authentication
              </h4>
              <p style={{ color: '#666', marginBottom: 0 }}>
                {twoFactorEnabled 
                  ? '✓ Enabled - Your account is protected with 2FA' 
                  : 'Add an extra layer of security with 2FA'}
              </p>
              <small style={{ color: '#999' }}>
                Use Google Authenticator, Authy, or Microsoft Authenticator
              </small>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onChange={handleToggle2FA}
              size="large"
            />
          </div>
        </div>

        {twoFactorEnabled && (
          <Alert
            message="2FA Enabled"
            description="Your account is protected with two-factor authentication. Keep your authenticator app safe and secure."
            type="success"
            showIcon
            style={{ marginTop: '15px' }}
          />
        )}
      </Card>

      {/* 2FA Setup Modal */}
      <TwoFactorAuthModal
        visible={setupModalVisible}
        onClose={() => setSetupModalVisible(false)}
        onSuccess={() => {
          setTwoFactorEnabled(true);
          checkTwoFactorStatus();
        }}
      />

      {/* 2FA Disable Modal */}
      <Modal
        title="Disable Two-Factor Authentication"
        open={disableModalVisible}
        onCancel={() => {
          setDisableOTP('');
          setDisableModalVisible(false);
        }}
        footer={null}
      >
        <Alert
          message="Enter your OTP code to disable 2FA"
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <Input
          placeholder="000000"
          maxLength={6}
          value={disableOTP}
          onChange={(e) => setDisableOTP(e.target.value.replace(/\D/g, ''))}
          size="large"
          style={{
            textAlign: 'center',
            letterSpacing: '8px',
            fontSize: '20px',
            marginBottom: '20px',
          }}
        />

        <Space style={{ width: '100%' }}>
          <Button 
            onClick={() => {
              setDisableOTP('');
              setDisableModalVisible(false);
            }}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            danger
            onClick={handleDisable2FA}
            loading={loading}
            disabled={disableOTP.length !== 6}
            style={{ flex: 1 }}
          >
            Disable 2FA
          </Button>
        </Space>
      </Modal>
    </div>
  );
}
