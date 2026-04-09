import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from './src/store/useStore';

import LoginScreen from './src/screens/LoginScreen';
import AvailableOrdersScreen from './src/screens/AvailableOrdersScreen';
import ActiveDeliveriesScreen from './src/screens/ActiveDeliveriesScreen';
import DeliveryMapScreen from './src/screens/DeliveryMapScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DriverTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleStyle: { fontSize: 16, fontWeight: 'bold' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AvailableOrders') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
          } else if (route.name === 'ActiveDeliveries') {
            iconName = focused ? 'truck' : 'truck-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 12 },
      })}
    >
      <Tab.Screen
        name="AvailableOrders"
        component={AvailableOrdersScreen}
        options={{ title: 'Đơn hàng sẵn có' }}
      />
      <Tab.Screen
        name="ActiveDeliveries"
        component={ActiveDeliveriesScreen}
        options={{ title: 'Đang giao hàng' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const { token, loadToken } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const initAuth = async () => {
      await loadToken();
      setIsReady(true);
    };

    initAuth();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          cardStyle: { backgroundColor: 'white' },
        }}
      >
        {token ? (
          <>
            <Stack.Screen
              name="Main"
              component={DriverTabs}
              options={{ animationEnabled: false }}
            />
            <Stack.Screen
              name="DeliveryMap"
              component={DeliveryMapScreen}
              options={{
                headerShown: true,
                title: 'Delivery Map',
                headerBackTitleVisible: false,
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animationEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
