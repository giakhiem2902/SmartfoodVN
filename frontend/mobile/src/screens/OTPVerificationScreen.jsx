import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/useStore';

export default function OTPVerificationScreen({ route, navigation }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { userId } = route.params || {};
  const setToken = useAuthStore((state) => state.setToken);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/2fa/verify', {
        token: otp,
      });

      if (response.data.success) {
        Alert.alert('Success', 'OTP verified!');
        
        // Navigate to main app after a brief delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }, 1000);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Invalid OTP. Please try again.',
        [{ text: 'OK' }]
      );
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCodeOption = () => {
    Alert.alert(
      'Backup Code',
      'Do not have access to authenticator app?',
      [
        {
          text: 'Contact Support',
          onPress: () => {
            // Could open support email or help page
            Alert.alert(
              'Support',
              'Contact us at support@smartfood.com for help recovering your account'
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Two-Factor Authentication</Text>

        <View style={styles.descriptionBox}>
          <Text style={styles.description}>
            Enter the 6-digit code from your authenticator app
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpInputContainer}>
          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/\D/g, ''))}
            maxLength={6}
            keyboardType="number-pad"
            editable={!loading}
            placeholderTextColor="#ccc"
          />
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            {
              opacity: loading || otp.length !== 6 ? 0.6 : 1,
            },
          ]}
          onPress={handleVerifyOTP}
          disabled={loading || otp.length !== 6}
        >
          <Text style={styles.verifyButtonText}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Backup Code Option */}
        <TouchableOpacity
          style={styles.backupButton}
          onPress={handleBackupCodeOption}
          disabled={loading}
        >
          <Text style={styles.backupButtonText}>
            Use Backup Code
          </Text>
        </TouchableOpacity>

        {/* Support Link */}
        <TouchableOpacity
          style={styles.supportButton}
          onPress={handleBackupCodeOption}
        >
          <Text style={styles.supportButtonText}>
            Need help? Contact support
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  descriptionBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  description: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
  otpInputContainer: {
    marginBottom: 25,
  },
  otpInput: {
    fontSize: 48,
    letterSpacing: 12,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
    paddingVertical: 15,
    color: '#333',
  },
  verifyButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#999',
    fontSize: 12,
  },
  backupButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  backupButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  supportButton: {
    paddingVertical: 10,
  },
  supportButtonText: {
    color: '#2196F3',
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
