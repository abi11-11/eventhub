import axios from 'axios';
import Constants from 'expo-constants';

/**
 * API Service
 * Handles all communication with the EventHub backend API
 * Automatically includes JWT tokens in Authorization header
 */

export const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
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
 * Register a token refresh handler
 * Called by Zustand auth store to wire up auto-refresh on 401
 */
let _refreshHandler = null;
export const registerRefreshHandler = (handler) => {
  _refreshHandler = handler;
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
 * Auto-retries the original request after a successful token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && _refreshHandler) {
      originalRequest._retry = true;
      try {
        await _refreshHandler();
        // Token already updated via setAuthTokens — retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ API Service: Token refresh failed, user must re-login');
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
    const response = await apiClient.put('/api/user/profile', profileData);
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
    const response = await apiClient.post(`/api/events/${eventId}/join`);
    return response.data;
  } catch (error) {
    console.error('❌ API Service: Failed to book event', error);
    throw error;
  }
};

/**
 * Cancel an event booking
 */
export const cancelBooking = async (eventId) => {
  try {
    const response = await apiClient.delete(`/api/events/${eventId}/leave`);
    return response.data;
  } catch (error) {
    console.error('❌ API Service: Failed to cancel booking', error);
    throw error;
  }
};

/**
 * Get user bookings
 */
export const getUserBookings = async () => {
  try {
    const response = await apiClient.get('/api/user/bookings');
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
    const response = await apiClient.post(`/api/events/${eventId}/reviews`, {
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
  registerRefreshHandler,
  getEvents,
  getUserProfile,
  updateUserProfile,
  bookEvent,
  cancelBooking,
  getUserBookings,
  submitReview,
};
