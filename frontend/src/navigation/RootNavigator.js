import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../store';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OTPScreen from '../screens/OTPScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Auth Stack
 * Login, Signup, OTP, ProfileSetup screens
 */
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          animationTypeForReplace: 'fade',
        }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          animationTypeForReplace: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{
          title: 'Verify OTP',
          animationTypeForReplace: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{
          title: 'Complete Your Profile',
          animationTypeForReplace: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * App Stack
 * Main app screens (Home, Event Details, etc.)
 * TODO: Add more screens as we implement more features
 */
function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#6750A4',
        tabBarInactiveTintColor: '#bdc3c7',
        tabBarStyle: {
          borderTopColor: '#ecf0f1',
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Discover',
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color }) => <View style={{ paddingTop: 2 }}><Text style={{ color, fontSize: 18 }}>🔍</Text></View>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsScreen}
        options={{
          title: 'My Bookings',
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color }) => <View style={{ paddingTop: 2 }}><Text style={{ color, fontSize: 18 }}>🎫</Text></View>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <View style={{ paddingTop: 2 }}><Text style={{ color, fontSize: 18 }}>👤</Text></View>,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Navigator
 * Uses Zustand auth state to determine which stack to show
 */
export function RootNavigator() {
  console.log('RootNavigator render start');
  const { isLoading, isAuthenticated, initializeAuth, user } = useAuthStore();
  console.log('RootNavigator state:', { isLoading, isAuthenticated, user: !!user });

  // Initialize auth state on mount
  useEffect(() => {
    console.log('RootNavigator useEffect run - initializeAuth');
    initializeAuth();
  }, []);

  // Show splash screen while checking auth state
  if (isLoading) {
    console.log('RootNavigator returning SplashScreen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <SplashScreen />
      </View>
    );
  }

  console.log('RootNavigator returning NavigationContainer');
  return (
    <NavigationContainer>
      {isAuthenticated && user ? (
        <AppStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
