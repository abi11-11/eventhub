import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import Constants from 'expo-constants';

/**
 * Firebase Service
 * Handles Firebase authentication initialization and OTP flow
 * Supports mock mode for development without Firebase setup
 */

// Get Firebase config from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.REACT_APP_FIREBASE_APP_ID,
};

// Check if we're in mock mode
const MOCK_MODE = Constants.expoConfig?.extra?.enableMockAuth || process.env.REACT_APP_ENABLE_MOCK_AUTH === 'true';
const MOCK_PHONE = Constants.expoConfig?.extra?.mockPhoneNumber || process.env.REACT_APP_MOCK_PHONE_NUMBER || '+919999999991';

let firebaseApp;
let auth;
let recaptchaVerifier;

/**
 * Initialize Firebase app
 * In mock mode, skips Firebase initialization
 */
export const initializeFirebase = () => {
  if (MOCK_MODE) {
    console.log('🔵 Firebase Service: Running in MOCK MODE');
    return null;
  }

  if (!firebaseApp) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
      auth = getAuth(firebaseApp);
      auth.useDeviceLanguage();
      console.log('✅ Firebase Service: Initialized successfully');
    } catch (error) {
      console.error('❌ Firebase Service: Initialization failed', error);
      throw error;
    }
  }
  return firebaseApp;
};

/**
 * Create RecaptchaVerifier for phone authentication
 * Note: In React Native with Expo, we use Firebase's built-in reCAPTCHA
 */
export const createRecaptchaVerifier = (containerOrID = 'recaptcha-container') => {
  if (MOCK_MODE) return null;

  try {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(containerOrID, {
        size: 'invisible',
        callback: (token) => {
          console.log('reCAPTCHA token generated');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA token expired');
          recaptchaVerifier = null;
        },
      }, auth);
    }
    return recaptchaVerifier;
  } catch (error) {
    console.error('❌ Firebase Service: reCAPTCHA creation failed', error);
    throw error;
  }
};

/**
 * Send OTP to phone number
 * Initiates Firebase phone authentication
 * In mock mode, returns a mock confirmation result
 */
export const sendOTP = async (phoneNumber) => {
  // Validate phone number format
  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    throw new Error('Phone number must be in E.164 format (e.g., +919999999991)');
  }

  if (MOCK_MODE) {
    console.log(`🔵 Firebase Service: Mock OTP sent to ${phoneNumber}`);
    // Return a mock confirmation result
    return {
      isMockMode: true,
      verificationId: `mock_verification_id_${Date.now()}`,
      phoneNumber,
      verifyOTP: async (otp) => {
        // Mock verification - any 6-digit OTP works
        if (!/^\d{6}$/.test(otp)) {
          throw new Error('OTP must be 6 digits');
        }
        console.log(`🔵 Firebase Service: Mock OTP verified: ${otp}`);
        return {
          isMockMode: true,
          idToken: `mock_id_token_${Date.now()}`,
          user: {
            uid: `mock_uid_${phoneNumber}`,
            phoneNumber,
          },
        };
      },
    };
  }

  try {
    const verifier = createRecaptchaVerifier();
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    console.log(`✅ Firebase Service: OTP sent to ${phoneNumber}`);
    
    return {
      isMockMode: false,
      verificationId: confirmationResult.verificationId,
      phoneNumber,
      verifyOTP: async (otp) => {
        try {
          const credential = confirmationResult.confirm(otp);
          const idToken = await credential.user.getIdToken();
          console.log(`✅ Firebase Service: OTP verified successfully`);
          return {
            isMockMode: false,
            idToken,
            user: {
              uid: credential.user.uid,
              phoneNumber: credential.user.phoneNumber,
            },
          };
        } catch (error) {
          if (error.code === 'auth/invalid-verification-code') {
            throw new Error('Invalid OTP. Please try again.');
          }
          throw error;
        }
      },
    };
  } catch (error) {
    console.error('❌ Firebase Service: OTP send failed', error);
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    }
    throw error;
  }
};

/**
 * Exchange Firebase ID Token for custom JWT
 * Calls backend API to verify Firebase token and issue JWT pair
 */
export const exchangeTokenForJWT = async (idToken, phoneNumber, apiBaseUrl) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        phoneNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token exchange failed');
    }

    const data = await response.json();
    console.log('✅ Firebase Service: JWT tokens received from backend');
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  } catch (error) {
    console.error('❌ Firebase Service: Token exchange failed', error);
    throw error;
  }
};

/**
 * Refresh JWT tokens using refresh token
 */
export const refreshJWT = async (refreshToken, apiBaseUrl) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token refresh failed');
    }

    const data = await response.json();
    console.log('✅ Firebase Service: JWT tokens refreshed successfully');
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    console.error('❌ Firebase Service: Token refresh failed', error);
    throw error;
  }
};

/**
 * Sign out user from Firebase
 */
export const signOutFromFirebase = async () => {
  if (MOCK_MODE) {
    console.log('🔵 Firebase Service: Mock sign out');
    return;
  }

  try {
    await signOut(auth);
    console.log('✅ Firebase Service: Signed out successfully');
  } catch (error) {
    console.error('❌ Firebase Service: Sign out failed', error);
    throw error;
  }
};

/**
 * Get current auth state
 */
export const getAuthState = () => {
  if (MOCK_MODE) {
    return { user: null };
  }
  return auth?.currentUser ? { user: auth.currentUser } : { user: null };
};

export default {
  initializeFirebase,
  createRecaptchaVerifier,
  sendOTP,
  exchangeTokenForJWT,
  refreshJWT,
  signOutFromFirebase,
  getAuthState,
};
