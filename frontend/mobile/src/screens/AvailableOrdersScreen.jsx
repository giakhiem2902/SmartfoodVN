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

const AvailableOrdersScreen = ({ navigation }) => {
  const { token } = useAuthStore();
  const { currentOrder, setCurrentOrder } = useDriverStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAvailableOrders();
    socketService.connect();

    socketService.onNewOrderAvailable((data) => {
      Alert.alert('New Order', `New order available! Order #${data.orderId}`, [
        { text: 'Dismiss' },
      ]);
      fetchAvailableOrders();
    });

    return () => {
      socketService.off('NEW_ORDER_AVAILABLE');
    };
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAvailableOrders(token);
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load available orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptOrder = async (order) => {
    try {
      const response = await apiClient.acceptOrder(token, order.id);
      if (response.success) {
        Alert.alert('Success', 'Order accepted!');
        setCurrentOrder(order);
        fetchAvailableOrders();
        navigation.navigate('ActiveDeliveries');
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order');
      console.error('Error:', error);
    }
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
        fetchAvailableOrders();
      }}
    >
      <Text style={styles.title}>🛍️ Available Orders</Text>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No available orders at the moment</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.id}</Text>
              <Text style={styles.price}>{order.total_price.toLocaleString()} đ</Text>
            </View>

            <View style={styles.orderInfo}>
              <Text style={styles.label}>📍 Destination:</Text>
              <Text style={styles.value}>{order.delivery_address}</Text>

              <Text style={styles.label}>📏 Distance:</Text>
              <Text style={styles.value}>{order.distance_km.toFixed(1)} km</Text>

              <Text style={styles.label}>🚚 Shipping Fee:</Text>
              <Text style={styles.value}>{order.shipping_fee.toLocaleString()} đ</Text>

              <View style={styles.itemsPreview}>
                <Text style={styles.label}>📦 Items:</Text>
                {order.items && order.items.slice(0, 3).map((item, idx) => (
                  <Text key={idx} style={styles.itemText}>
                    • {item.food.name} x {item.quantity}
                  </Text>
                ))}
                {order.items && order.items.length > 3 && (
                  <Text style={styles.moreItems}>+{order.items.length - 3} more</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptOrder(order)}
            >
              <Text style={styles.acceptButtonText}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
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
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00cc66',
  },
  orderInfo: {
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
  itemsPreview: {
    marginTop: 8,
  },
  itemText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
    marginTop: 2,
  },
  acceptButton: {
    backgroundColor: '#00cc66',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AvailableOrdersScreen;
