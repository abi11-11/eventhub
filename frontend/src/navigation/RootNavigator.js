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
        tabBarActiveTintColor: '#3498db',
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
          tabBarIcon: ({ color }) => <View style={{ color }}>🔍</View>,
          headerShown: false,
        }}
      />
      {/* TODO: Add more tabs
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      */}
    </Tab.Navigator>
  );
}

/**
 * Root Navigator
 * Uses Zustand auth state to determine which stack to show
 */
export function RootNavigator() {
  const { isLoading, isAuthenticated, initializeAuth, user } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Show splash screen while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <SplashScreen />
      </View>
    );
  }

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
