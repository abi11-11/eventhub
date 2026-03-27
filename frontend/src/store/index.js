import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,

      login: async (phoneNumber) => {
        // TODO: Call OTP endpoint
        set({
          user: { phoneNumber },
          token: 'temp_token',
          refreshToken: 'temp_refresh_token',
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
        });
      },

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
      storage: AsyncStorage,
    }
  )
);

export const useEventStore = create((set) => ({
  events: [],
  currentEvent: null,
  filters: { eventType: '', skillLevel: '', distance: 10 },

  setEvents: (events) => set({ events }),
  setCurrentEvent: (event) => set({ currentEvent: event }),
  setFilters: (filters) => set({ filters }),
}));

export const useUIStore = create((set) => ({
  theme: 'light',
  bottomSheetVisible: false,
  modalVisible: false,

  setTheme: (theme) => set({ theme }),
  setBottomSheetVisible: (visible) => set({ bottomSheetVisible: visible }),
  setModalVisible: (visible) => set({ modalVisible: visible }),
}));
