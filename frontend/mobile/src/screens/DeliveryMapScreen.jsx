import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { useAuthStore, useDriverStore } from '../store/useStore';
import socketService from '../services/socketService';
import apiClient from '../services/apiClient';

const DeliveryMapScreen = ({ route }) => {
  const { orderId } = route.params;
  const { token, user } = useAuthStore();
  const { currentOrder } = useDriverStore();
  const [driverLocation, setDriverLocation] = useState(null);
  const [order, setOrder] = useState(currentOrder);
  const mapRef = useRef(null);
  const locationWatchId = useRef(null);

  useEffect(() => {
    fetchOrder();
    startLocationTracking();
    socketService.connect();
    socketService.joinOrder(orderId, user.id);

    return () => {
      if (locationWatchId.current) {
        Geolocation.clearWatch(locationWatchId.current);
      }
      socketService.leaveOrder(orderId);
    };
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.getOrder(token, orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const startLocationTracking = () => {
    locationWatchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDriverLocation({ latitude, longitude });

        // Send location to server
        socketService.updateDriverLocation(orderId, latitude, longitude, user.id);

        // Auto-center map
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      },
      (error) => {
        console.log('Location error:', error);
        Alert.alert('Location Error', 'Failed to get your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        distanceFilter: 10,
      }
    );
  };

  const handleCompleteDelivery = async () => {
    Alert.alert('Complete Delivery', 'Mark this delivery as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            const response = await apiClient.updateOrderStatus(token, orderId, 'COMPLETED');
            if (response.success) {
              Alert.alert('Success', 'Delivery completed!');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to complete delivery');
          }
        },
      },
    ]);
  };

  if (!driverLocation || !order) {
    return (
      <View style={styles.container}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Driver Marker */}
        <Marker
          coordinate={driverLocation}
          title="Your Location"
          pinColor="blue"
        />

        {/* Delivery Marker */}
        <Marker
          coordinate={{
            latitude: parseFloat(order.delivery_lat),
            longitude: parseFloat(order.delivery_lng),
          }}
          title="Delivery Location"
          pinColor="green"
        />

        {/* Store Marker */}
        {order.store && (
          <Marker
            coordinate={{
              latitude: parseFloat(order.store.lat),
              longitude: parseFloat(order.store.lng),
            }}
            title={order.store.name}
            pinColor="red"
          />
        )}
      </MapView>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Delivery Info</Text>
        <Text style={styles.detail}>📍 {order.delivery_address}</Text>
        <Text style={styles.detail}>💰 {order.total_price.toLocaleString()} đ</Text>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteDelivery}
        >
          <Text style={styles.completeButtonText}>Mark as Delivered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  completeButton: {
    backgroundColor: '#00cc66',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default DeliveryMapScreen;
