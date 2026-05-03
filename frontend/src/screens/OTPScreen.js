import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store';
import firebaseService from '../services/firebase-service';

/**
 * OTPScreen
 * Handles OTP verification with:
 * - Auto-fill support (SMS Retriever API on Android, QuickType on iOS)
 * - Manual 6-digit input
 * - Resend OTP with countdown timer
 * - Error handling and retry logic
 */

export default function OTPScreen({ navigation, route }) {
  const { phoneNumber, confirmationResult } = route.params;
  
  // State management
  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // Reference for auto-fill
  const otpInputRef = useRef(null);
  
  // Store actions
  const { setUser, setToken } = useAuthStore();

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  /**
   * Verify OTP and exchange for JWT tokens
   */
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Verify OTP with Firebase
      console.log('🔵 OTPScreen: Verifying OTP...');
      const verifyResult = await confirmationResult.verifyOTP(otp);
      const { idToken, user } = verifyResult;

      console.log('✅ OTPScreen: OTP verified, exchanging for JWT...');

      // Step 2: Exchange Firebase ID Token for custom JWT
      const jwtData = await firebaseService.exchangeTokenForJWT(
        idToken,
        phoneNumber,
        process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'
      );

      // Step 3: Update Zustand store with tokens and user data
      setUser({
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        ...jwtData.user,
      });
      setToken(jwtData.accessToken);

      // Store refresh token separately (handled by auth store persistence)
      useAuthStore.setState({
        refreshToken: jwtData.refreshToken,
      });

      console.log('✅ OTPScreen: Login successful!');

      // Navigate to ProfileSetup if first-time user, else Home
      if (jwtData.user.isNewUser) {
        navigation.replace('ProfileSetup');
      } else {
        navigation.replace('Home');
      }
    } catch (err) {
      console.error('❌ OTPScreen: Verification failed', err);
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🔵 OTPScreen: Resending OTP...');
      const newConfirmationResult = await firebaseService.sendOTP(phoneNumber);
      
      // Update route params with new confirmation result
      route.params.confirmationResult = newConfirmationResult;
      
      setOTP('');
      setResendCountdown(60);
      console.log('✅ OTPScreen: OTP resent successfully');
      
      Alert.alert('Success', 'OTP has been resent to your phone number');
    } catch (err) {
      console.error('❌ OTPScreen: Resend failed', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle manual OTP input
   * Supports auto-fill via OS
   */
  const handleOTPChange = (value) => {
    // Only allow digits
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Limit to 6 digits
    if (numericValue.length <= 6) {
      setOTP(numericValue);
      setError('');
      
      // Auto-submit when 6 digits are entered
      if (numericValue.length === 6) {
        // Optional: auto-submit after slight delay to allow user to see all digits
        setTimeout(() => {
          // Don't auto-submit, let user tap verify button for explicit confirmation
        }, 100);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpSection}>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            ref={otpInputRef}
            style={[styles.otpInput, error ? styles.otpInputError : null]}
            placeholder="000000"
            placeholderTextColor="#ccc"
            value={otp}
            onChangeText={handleOTPChange}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
            // Auto-fill support
            textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'none'}
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          />
          <View style={styles.otpDigitDisplay}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={[
                  styles.otpDigit,
                  otp[index] ? styles.otpDigitFilled : null,
                  error ? styles.otpDigitError : null,
                ]}
              >
                <Text style={styles.otpDigitText}>{otp[index] || ''}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={resendCountdown > 0 || isLoading}
          >
            <Text
              style={[
                styles.resendLink,
                (resendCountdown > 0 || isLoading) && styles.resendLinkDisabled,
              ]}
            >
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Additional Help */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            {Platform.OS === 'ios'
              ? 'iOS: Check your QuickType suggestions'
              : 'Android: OTP will auto-fill when received'}
          </Text>
        </View>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  phoneNumber: {
    fontWeight: '600',
    color: '#000',
  },
  otpSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  otpInput: {
    display: 'none', // Hidden input for auto-fill
  },
  otpInputError: {
    borderColor: '#e74c3c',
  },
  otpDigitDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  otpDigit: {
    width: '15%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  otpDigitFilled: {
    borderColor: '#3498db',
    backgroundColor: '#ecf0f1',
  },
  otpDigitError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fadbd8',
  },
  otpDigitText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
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
  verifyButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  resendLinkDisabled: {
    color: '#bdc3c7',
  },
  helpSection: {
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
