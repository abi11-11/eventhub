import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = React.useState('');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>EventHub</Text>
        <Text style={styles.subtitle}>Welcome Back</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          placeholderTextColor="#999"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>

        <Text style={styles.signupText}>
          Don't have an account?{' '}
          <Text style={styles.signupLink} onPress={() => navigation.navigate('Signup')}>
            Sign up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
