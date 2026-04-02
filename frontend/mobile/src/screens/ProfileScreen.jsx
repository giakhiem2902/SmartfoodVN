import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useDriverStore } from '../store/useStore';
import apiClient from '../services/apiClient';
import socketService from '../services/socketService';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { isOnline, setIsOnline, currentLocation } = useDriverStore();
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    socketService.connect();
  }, []);

  const handleToggleStatus = async () => {
    try {
      setToggling(true);
      const { token } = useAuthStore.getState();
      const response = await apiClient.toggleDriverStatus(token);

      if (response.success) {
        setIsOnline(!isOnline);

        if (!isOnline) {
          socketService.driverOnline(user.id);
        } else {
          socketService.driverOffline(user.id);
        }

        Alert.alert('Success', isOnline ? 'You are now OFFLINE' : 'You are now ONLINE');
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
      console.error('Error:', error);
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: isOnline ? '#e8f5e9' : '#ffebee' }]}>
        <View style={styles.statusContent}>
          <MaterialCommunityIcons
            name={isOnline ? 'check-circle' : 'close-circle'}
            size={40}
            color={isOnline ? '#4caf50' : '#f44336'}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusValue, { color: isOnline ? '#4caf50' : '#f44336' }]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.statusToggle, { backgroundColor: isOnline ? '#4caf50' : '#999' }]}
          onPress={handleToggleStatus}
          disabled={toggling}
        >
          <Text style={styles.toggleText}>{toggling ? 'Updating...' : (isOnline ? 'Go Offline' : 'Go Online')}</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileCard}>
        <Text style={styles.profileTitle}>Profile Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Username</Text>
          <Text style={styles.infoValue}>{user.username}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user.phone || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Location</Text>
          {currentLocation ? (
            <Text style={styles.infoValue}>
              {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.infoValue}>Getting location...</Text>
          )}
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  statusCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 15,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ProfileScreen;
