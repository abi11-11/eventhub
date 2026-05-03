import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import firebaseService from '../services/firebase-service';

/**
 * LoginScreen
 * Collects phone number and initiates Firebase OTP flow
 * Supports international format (+country code)
 */

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle phone number input
   * Ensures E.164 format (+country code)
   */
  const handlePhoneChange = (value) => {
    // Allow only digits and + symbol
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    let formatted = cleaned;
    if (cleaned && !cleaned.startsWith('+')) {
      formatted = '+' + cleaned;
    }

    // Limit to reasonable phone length
    if (formatted.length <= 15) {
      setPhoneNumber(formatted);
      setError('');
    }
  };

  /**
   * Validate phone number format
   */
  const validatePhoneNumber = (phone) => {
    // E.164 format: +[1-9]{1-3}[0-9]{3,14}
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  /**
   * Send OTP via Firebase
   */
  const handleSendOTP = async () => {
    // Validate input
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (e.g., +919999999991)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔵 LoginScreen: Initiating OTP flow...');
      
      // Send OTP via Firebase
      const confirmationResult = await firebaseService.sendOTP(phoneNumber);
      
      console.log('✅ LoginScreen: OTP sent successfully');

      // Navigate to OTP verification screen
      navigation.navigate('OTP', {
        phoneNumber,
        confirmationResult,
      });
    } catch (err) {
      console.error('❌ LoginScreen: OTP send failed', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      
      // Show detailed error for testing
      if (process.env.REACT_APP_ENV === 'development') {
        Alert.alert('OTP Send Error', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate to signup
   */
  const handleSignupNavigate = () => {
    navigation.navigate('Signup', { phoneNumber });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎉</Text>
          <Text style={styles.title}>EventHub</Text>
          <Text style={styles.subtitle}>Discover Events Near You</Text>
        </View>

        {/* Phone Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
            <Text style={styles.countryCode}>+</Text>
            <TextInput
              style={styles.input}
              placeholder="1 (555) 000-0000"
              placeholderTextColor="#bdc3c7"
              value={phoneNumber.substring(1)} // Remove + for display
              onChangeText={(text) => handlePhoneChange('+' + text)}
              keyboardType="phone-pad"
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
            />
          </View>
          <Text style={styles.helpText}>We'll send an OTP to verify your number</Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (isLoading || !phoneNumber) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendOTP}
          disabled={isLoading || !phoneNumber}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Signup Section */}
        <View style={styles.signupSection}>
          <Text style={styles.signupText}>New to EventHub?</Text>
          <TouchableOpacity onPress={handleSignupNavigate} disabled={isLoading}>
            <Text style={styles.signupLink}>Create an account</Text>
          </TouchableOpacity>
        </View>

        {/* Development Info */}
        {process.env.REACT_APP_ENV === 'development' && (
          <View style={styles.devInfo}>
            <Text style={styles.devInfoText}>
              Dev: Use +919999999991 with OTP 000000
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  inputSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  inputContainerError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fadbd8',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#000',
  },
  helpText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  errorContainer: {
    backgroundColor: '#fadbd8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#7f8c8d',
    fontSize: 13,
  },
  signupSection: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  devInfo: {
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 10,
    marginTop: 20,
  },
  devInfoText: {
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
