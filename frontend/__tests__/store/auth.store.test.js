import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../../src/store';

/**
 * AUTH STORE TESTS
 * Unit tests for authentication state management
 */

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  describe('User Authentication', () => {
    it('should set user data after login', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser = {
        uid: 'user123',
        phoneNumber: '+919999999991',
        firstName: 'John',
        lastName: 'Doe',
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(expect.objectContaining(mockUser));
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear user data on logout', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setUser({
          uid: 'user123',
          phoneNumber: '+919999999991',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('should set access token', () => {
      const { result } = renderHook(() => useAuthStore());
      const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

      act(() => {
        result.current.setToken(token);
      });

      expect(result.current.accessToken).toBe(token);
    });

    it('should set token pair', () => {
      const { result } = renderHook(() => useAuthStore());
      const accessToken = 'access_token_value';
      const refreshToken = 'refresh_token_value';

      act(() => {
        result.current.setTokens(accessToken, refreshToken);
      });

      expect(result.current.accessToken).toBe(accessToken);
      expect(result.current.refreshToken).toBe(refreshToken);
    });
  });

  describe('Profile Updates', () => {
    it('should update user profile', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          uid: 'user123',
          phoneNumber: '+919999999991',
          firstName: 'John',
        });
      });

      act(() => {
        result.current.updateProfile({
          firstName: 'Jane',
          lastName: 'Smith',
        });
      });

      expect(result.current.user.firstName).toBe('Jane');
      expect(result.current.user.lastName).toBe('Smith');
      expect(result.current.user.isProfileComplete).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should set and clear error messages', () => {
      const { result } = renderHook(() => useAuthStore());
      const errorMsg = 'Authentication failed';

      act(() => {
        result.current.setError(errorMsg);
      });

      expect(result.current.error).toBe(errorMsg);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
