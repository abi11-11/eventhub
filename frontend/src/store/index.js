import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthTokens, clearAuthTokens, registerRefreshHandler, API_BASE_URL } from '../services/api-service';
import firebaseService from '../services/firebase-service';

/**
 * Zustand Auth Store
 * Manages authentication state, tokens, and user data
 * Persists to AsyncStorage for offline access
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Actions
      /**
       * Initialize auth state on app startup
       * Restores user session from persistent storage
       */
      initializeAuth: async () => {
        try {
          set({ isLoading: true });
          // AsyncStorage restoration happens automatically via persist middleware
          console.log('✅ Auth Store: Initialized');
        } catch (err) {
          console.error('❌ Auth Store: Initialization failed', err);
          set({ error: err.message });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Set user data after successful login
       */
      setUser: (user) => {
        set({
          user: {
            uid: user.uid || '',
            phoneNumber: user.phoneNumber || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            profilePhoto: user.profilePhoto || '',
            isProfileComplete: user.isProfileComplete || false,
            ...user,
          },
          isAuthenticated: !!user.uid,
        });
      },

      /**
       * Set access token and sync with API service
       */
      setToken: (token) => {
        set({ accessToken: token });
        setAuthTokens(token, get().refreshToken);
      },

      /**
       * Set tokens pair (access + refresh)
       */
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        setAuthTokens(accessToken, refreshToken);
      },

      /**
       * Update profile data
       */
      updateProfile: (profileData) => {
        const current = get().user;
        set({
          user: {
            ...current,
            ...profileData,
            isProfileComplete: true,
          },
        });
      },

      /**
       * Refresh tokens using refresh token
       */
      refreshTokens: async (apiBaseUrl) => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const tokens = await firebaseService.refreshJWT(refreshToken, apiBaseUrl);
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
          setAuthTokens(tokens.accessToken, tokens.refreshToken);
          return tokens;
        } catch (err) {
          console.error('❌ Auth Store: Token refresh failed', err);
          get().logout();
          throw err;
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        try {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          clearAuthTokens();
          await firebaseService.signOutFromFirebase();
          console.log('✅ Auth Store: Logged out');
        } catch (err) {
          console.error('❌ Auth Store: Logout failed', err);
        }
      },

      /**
       * Set error message
       */
      setError: (error) => set({ error }),

      /**
       * Clear error message
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: AsyncStorage,
      // Only persist specific fields
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Zustand Event Store
 * Manages events data and user interactions
 */
export const useEventStore = create(
  persist(
    (set) => ({
      // State
      events: [],
      filteredEvents: [],
      currentEvent: null,
      userBookings: [],
      filters: {
        eventType: '', // e.g., 'sports', 'social', 'workshop'
        skillLevel: '', // e.g., 'beginner', 'intermediate', 'advanced'
        distance: 10, // in km
        searchQuery: '',
      },
      isLoading: false,
      error: null,

      // Actions
      /**
       * Set all events
       */
      setEvents: (events) => {
        set({ events, filteredEvents: events });
      },

      /**
       * Set filtered events based on criteria
       */
      setFilteredEvents: (events) => set({ filteredEvents: events }),

      /**
       * Get filtered events based on current filters
       */
      applyFilters: (events, filters) => {
        let filtered = events;

        if (filters.eventType) {
          filtered = filtered.filter((e) => e.type === filters.eventType);
        }
        if (filters.skillLevel) {
          filtered = filtered.filter((e) => e.skillLevel === filters.skillLevel);
        }
        if (filters.searchQuery) {
          filtered = filtered.filter(
            (e) =>
              e.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
              e.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
          );
        }

        set({ filteredEvents: filtered });
        return filtered;
      },

      /**
       * Set current selected event
       */
      setCurrentEvent: (event) => set({ currentEvent: event }),

      /**
       * Update filters
       */
      setFilters: (filters) => {
        set({ filters });
      },

      /**
       * Set user bookings
       */
      setUserBookings: (bookings) => set({ userBookings: bookings }),

      /**
       * Add user booking
       */
      addBooking: (booking) => {
        set((state) => ({
          userBookings: [...state.userBookings, booking],
        }));
      },

      /**
       * Remove user booking
       */
      removeBooking: (eventId) => {
        set((state) => ({
          userBookings: state.userBookings.filter((b) => b.eventId !== eventId),
        }));
      },

      /**
       * Set loading state
       */
      setIsLoading: (isLoading) => set({ isLoading }),

      /**
       * Set error
       */
      setError: (error) => set({ error }),

      /**
       * Clear error
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: 'event-storage',
      storage: AsyncStorage,
    }
  )
);

/**
 * Zustand UI Store
 * Manages global UI state
 */
export const useUIStore = create((set) => ({
  // State
  theme: 'light', // 'light' or 'dark'
  bottomSheetVisible: false,
  modalVisible: false,
  loadingIndicatorVisible: false,
  toastMessage: null,
  toastType: null, // 'success', 'error', 'warning', 'info'

  // Actions
  /**
   * Set theme
   */
  setTheme: (theme) => set({ theme }),

  /**
   * Toggle theme
   */
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),

  /**
   * Show/hide bottom sheet
   */
  setBottomSheetVisible: (visible) => set({ bottomSheetVisible: visible }),

  /**
   * Show/hide modal
   */
  setModalVisible: (visible) => set({ modalVisible: visible }),

  /**
   * Show/hide loading indicator
   */
  setLoadingIndicatorVisible: (visible) => set({ loadingIndicatorVisible: visible }),

  /**
   * Show toast notification
   */
  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      set({ toastMessage: null, toastType: null });
    }, 3000);
  },

  /**
   * Hide toast
   */
  hideToast: () => set({ toastMessage: null, toastType: null }),
}));

// Wire Axios 401 interceptor to auto-refresh using the auth store.
// Uses a callback to avoid circular imports between api-service and store.
registerRefreshHandler(async () => {
  const { refreshTokens } = useAuthStore.getState();
  await refreshTokens(API_BASE_URL);
});

export default {
  useAuthStore,
  useEventStore,
  useUIStore,
};
