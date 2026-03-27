import axios from 'axios';
import Constants from 'expo-constants';

/**
 * API Service
 * Handles all communication with the EventHub backend API
 * Automatically includes JWT tokens in Authorization header
 */

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(Constants.expoConfig?.extra?.apiTimeout || process.env.REACT_APP_API_TIMEOUT || '10000', 10);

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token store (will be updated by auth store)
let authToken = null;
let refreshToken = null;

/**
 * Set auth tokens from auth store
 * Called by Zustand auth store after successful login
 */
export const setAuthTokens = (accessToken, refresh) => {
  authToken = accessToken;
  refreshToken = refresh;
  if (accessToken) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Clear auth tokens
 * Called by Zustand auth store on logout
 */
export const clearAuthTokens = () => {
  authToken = null;
  refreshToken = null;
  delete apiClient.defaults.headers.common['Authorization'];
};

/**
 * Request interceptor - add token to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle token refresh on 401
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get a 401 and haven't already tried to refresh, attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (refreshToken) {
          // Call this function from auth store to refresh token
          // For now, we'll let auth store handle this
          console.log('⚠️  API Service: Token expired, please login again');
        }
      } catch (refreshError) {
        console.error('❌ API Service: Token refresh fail, user must re-login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Get current events with optional filters
 */
export const getEvents = async (filters = {}) => {
  try {
    const response = await apiClient.get('/api/events', { params: filters });
    return response.data;
  } catch (error) {
    console.error('❌ API Service: Failed to fetch events', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('❌ API Service: Failed to fetch user profile', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/api/users/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('❌ API Service: Failed to update profile', error);
    throw error;
  }
};

/**
 * Book an event
 */
export const bookEvent = async (eventId) => {
  try {
    const response = await apiClient.post(`/api/events/${eventId}/book`);
    return response.data;
  } catch (error) {
    console.error('❌ API Service: Failed to book event', error);
    throw error;
  }
};

/**
 * Get user bookings
 */
export const getUserBookings = async () => {
  try {
    const response = await apiClient.get('/api/users/bookings');
    return response.data;
  } catch (error) {
    console.error('❌ API Service: Failed to fetch bookings', error);
    throw error;
  }
};

/**
 * Submit event review
 */
export const submitReview = async (eventId, rating, comment) => {
  try {
    const response = await apiClient.post(`/api/events/${eventId}/review`, {
      rating,
      comment,
    });
    return response.data;
  } catch (error) {
    console.error('❌ API Service: Failed to submit review', error);
    throw error;
  }
};

export default {
  apiClient,
  setAuthTokens,
  clearAuthTokens,
  getEvents,
  getUserProfile,
  updateUserProfile,
  bookEvent,
  getUserBookings,
  submitReview,
};
