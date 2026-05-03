import React, { useEffect } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { RootNavigator } from './src/navigation/RootNavigator';
import firebaseService from './src/services/firebase-service';

// Suppress specific warnings in development
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
]);

/**
 * Root App Component
 * Initializes Firebase and renders the navigation stack
 */
export default function App() {
  console.log('App render start');
  useEffect(() => {
    console.log('App useEffect run');
    // Initialize Firebase on app startup
    try {
      firebaseService.initializeFirebase();
      console.log('✅ App: Firebase initialized');
    } catch (error) {
      console.error('❌ App: Firebase initialization failed', error);
    }
  }, []);

  console.log('App returning UI');
  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider>
        <View style={styles.container}>
          <RootNavigator />
        </View>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
