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
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store';
import { updateUserProfile } from '../services/api-service';

/**
 * ProfileSetupScreen
 * Minimal profile setup (First Name, Last Name, optional photo)
 * Users can complete comprehensive profile later from Home screen
 * 
 * Progressive approach: Get user into the app quickly
 */

export default function ProfileSetupScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, setUser } = useAuthStore();

  /**
   * Pick profile photo from device library or camera
   */
  const handlePickPhoto = async () => {
    try {
      // Request permissions if needed
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is required to upload a photo');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.error('❌ ProfileSetupScreen: Photo pick failed', err);
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  /**
   * Complete profile setup
   */
  const handleCompleteSetup = async () => {
    // Validate required fields
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }

    if (!lastName.trim()) {
      setError('Please enter your last name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔵 ProfileSetupScreen: Updating profile...');

      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        // Profile photo upload would require more complex handling
        // For now, we'll just store the metadata
      };

      // Call API to update profile
      const updatedUser = await updateUserProfile(profileData);

      // Update Zustand store
      setUser({
        ...user,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isProfileComplete: true,
      });

      console.log('✅ ProfileSetupScreen: Profile setup complete');

      // Navigate to Home screen
      navigation.replace('Home');
    } catch (err) {
      console.error('❌ ProfileSetupScreen: Profile update failed', err);
      setError(err.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Skip for now - go to Home screen
   * User can complete profile later via settings
   */
  const handleSkipForNow = () => {
    // Update profile with just names
    setUser({
      ...user,
      firstName: firstName.trim() || 'User',
      lastName: lastName.trim() || '',
    });
    navigation.replace('Home');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Let other users know who you are{'\n'}
            <Text style={styles.subtitleSmall}>(You can change this later)</Text>
          </Text>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={handlePickPhoto}
            disabled={isLoading}
          >
            {profilePhoto ? (
              <>
                <Image source={{ uri: profilePhoto }} style={styles.photoImage} />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoOverlayText}>Change</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.photoPlaceholder}>📷</Text>
                <Text style={styles.photoText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.photoHelpText}>Optional but recommended</Text>
        </View>

        {/* Name Input Section */}
        <View style={styles.inputSection}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, error && !firstName ? styles.inputError : null]}
              placeholder="John"
              placeholderTextColor="#bdc3c7"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setError('');
              }}
              editable={!isLoading}
              returnKeyType="next"
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, error && !lastName ? styles.inputError : null]}
              placeholder="Doe"
              placeholderTextColor="#bdc3c7"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setError('');
              }}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleCompleteSetup}
            />
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            (isLoading || !firstName || !lastName) && styles.buttonDisabled,
          ]}
          onPress={handleCompleteSetup}
          disabled={isLoading || !firstName || !lastName}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>Continue to Home</Text>
          )}
        </TouchableOpacity>

        {/* Skip Option */}
        <TouchableOpacity
          onPress={handleSkipForNow}
          disabled={isLoading}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            ℹ️ You can update your profile and add more details like bio and skills later in Settings.
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
    paddingVertical: 30,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  subtitleSmall: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecf0f1',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  photoOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPlaceholder: {
    fontSize: 40,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  photoHelpText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  inputSection: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fadbd8',
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
  completeButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipText: {
    textAlign: 'center',
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  infoBanner: {
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 12,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 18,
  },
});
