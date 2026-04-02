import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore, useDriverStore } from '../store/useStore';
import apiClient from '../services/apiClient';
import socketService from '../services/socketService';

const ActiveDeliveriesScreen = ({ navigation }) => {
  const { token } = useAuthStore();
  const { acceptedOrders, setAcceptedOrders, currentOrder, setCurrentOrder } = useDriverStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActiveOrders();
    socketService.connect();

    socketService.onOrderStatusChanged((data) => {
      if (data.orderId === currentOrder?.id) {
        setCurrentOrder({ ...currentOrder, status: data.status });
      }
    });
  }, []);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDriverOrders(token);
      if (response.success) {
        setAcceptedOrders(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await apiClient.updateOrderStatus(token, orderId, status);
      if (response.success) {
        Alert.alert('Success', 'Order status updated');
        fetchActiveOrders();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update order');
      console.error('Error:', error);
    }
  };

  const handleStartDelivery = (order) => {
    setCurrentOrder(order);
    updateOrderStatus(order.id, 'DELIVERING');
    navigation.navigate('DeliveryMap', { orderId: order.id });
  };

  const handleCompleteDelivery = (orderId) => {
    Alert.alert('Complete Delivery', 'Confirm delivery completion?', [
      {
        text: 'No',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => updateOrderStatus(orderId, 'COMPLETED'),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        fetchActiveOrders();
      }}
    >
      <Text style={styles.title}>📦 Active Deliveries</Text>

      {acceptedOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active deliveries</Text>
        </View>
      ) : (
        acceptedOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.id}</Text>
              <Text style={[styles.status, { color: getStatusColor(order.status) }]}>
                {order.status}
              </Text>
            </View>

            <View style={styles.orderDetails}>
              <Text style={styles.label}>📍 Delivery Address:</Text>
              <Text style={styles.value}>{order.delivery_address}</Text>

              <Text style={styles.label}>💰 Total Price:</Text>
              <Text style={styles.value}>{order.total_price.toLocaleString()} đ</Text>

              <Text style={styles.label}>📏 Distance:</Text>
              <Text style={styles.value}>{order.distance_km.toFixed(1)} km</Text>

              <Text style={styles.label}>🚚 Shipping Fee:</Text>
              <Text style={styles.value}>{order.shipping_fee.toLocaleString()} đ</Text>
            </View>

            <View style={styles.buttonGroup}>
              {order.status === 'DRIVER_ACCEPTED' && (
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => handleStartDelivery(order)}
                >
                  <Text style={styles.buttonText}>Start Delivery</Text>
                </TouchableOpacity>
              )}

              {order.status === 'DELIVERING' && (
                <TouchableOpacity
                  style={[styles.button, styles.successButton]}
                  onPress={() => handleCompleteDelivery(order.id)}
                >
                  <Text style={styles.buttonText}>Complete Delivery</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const getStatusColor = (status) => {
  const colors = {
    PENDING: '#ff9500',
    CONFIRMED: '#0066cc',
    FINDING_DRIVER: '#00ccff',
    DRIVER_ACCEPTED: '#00cc66',
    DELIVERING: '#0066cc',
    COMPLETED: '#00cc66',
  };
  return colors[status] || '#666';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  orderDetails: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  successButton: {
    backgroundColor: '#00cc66',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ActiveDeliveriesScreen;
