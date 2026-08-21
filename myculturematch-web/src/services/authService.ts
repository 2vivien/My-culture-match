import { api, USE_MOCK } from './api';
import { getAuthToken, setAuthToken, clearAuthToken } from './auth.token';
import { useAppStore } from '@/src/stores/useAppStore';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  emailVerified: boolean;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  bannedAt: string | null;
}

export interface VerifyOtpResponse {
  token: string;
  user: AuthUser;
  isNewUser: boolean;
}

export interface TwoFactorRequiredResponse {
  twoFactorRequired: true;
  ticket: string;
  user: AuthUser;
}

export type LoginResponse = VerifyOtpResponse | TwoFactorRequiredResponse;

export interface SessionResponse {
  user: AuthUser;
  token: string;
}

const MOCK_USER: AuthUser = {
  id: 'user-current',
  email: 'amal@culture.com',
  name: 'Amal',
  username: 'amal',
  avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Amal',
  emailVerified: true,
  role: 'user',
  bannedAt: null,
};

export const authService = {
  /**
   * Restore session on app mount.
   * - USE_MOCK: read from localStorage, set authenticated if token exists
   * - USE_MOCK + no token: check if user previously logged in via app-store
   * - Real API: validate token with server
   */
  restoreSession(): boolean {
    if (USE_MOCK) {
      const store = useAppStore.getState();
      // If the user was already authenticated in this session (persisted by zustand)
      if (store.isAuthenticated && store.isOnboarded) {
        return true;
      }
      // Check if there's a mock token stored
      const token = getAuthToken();
      if (token) {
        store.setAuthenticated(true);
        store.setOnboarded(true);
        return true;
      }
      return false;
    }

    // Real API: try to restore session via token
    const token = getAuthToken();
    if (!token) return false;

    // Validate token with server (async, fire and forget)
    this.getSession()
      .then((session) => {
        const store = useAppStore.getState();
        store.loginUser({
          id: session.user.id,
          name: session.user.name ?? session.user.email,
          avatar: session.user.avatar ?? undefined,
        });
        store.setAuthenticated(true);
        store.setOnboarded(true);
      })
      .catch(() => {
        clearAuthToken();
      });

    return !!token;
  },

  async sendOtp(email: string): Promise<{ success: boolean; cooldown: number }> {
    if (USE_MOCK) {
      // Simulate sending OTP — always succeeds in mock
      return { success: true, cooldown: 60 };
    }
    return api.post<{ success: boolean; cooldown: number }>('/api/auth/send-otp', { email });
  },

  async verifyOtp(email: string, code: string): Promise<LoginResponse> {
    if (USE_MOCK) {
      // In mock mode, any 6-digit code works
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        throw new Error('Le code doit contenir 6 chiffres.');
      }
      const result: VerifyOtpResponse = {
        token: `mock-token-${Date.now()}`,
        user: { ...MOCK_USER, email },
        isNewUser: false,
      };
      setAuthToken(result.token);
      return result;
    }
    const result = await api.post<LoginResponse>('/api/auth/verify-otp', { email, code });
    if ('token' in result) setAuthToken(result.token);
    return result;
  },

  async verifyTwoFactor(ticket: string, code: string): Promise<VerifyOtpResponse> {
    if (USE_MOCK) {
      return {
        token: `mock-2fa-token-${Date.now()}`,
        user: MOCK_USER,
        isNewUser: false,
      };
    }
    const result = await api.post<VerifyOtpResponse>('/api/auth/2fa/verify', { ticket, code });
    setAuthToken(result.token);
    return result;
  },

  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    if (USE_MOCK) {
      const result: VerifyOtpResponse = {
        token: `mock-google-token-${Date.now()}`,
        user: MOCK_USER,
        isNewUser: false,
      };
      setAuthToken(result.token);
      return result;
    }
    const result = await api.post<LoginResponse>('/api/auth/google', { idToken });
    if ('token' in result) setAuthToken(result.token);
    return result;
  },

  async loginWithApple(idToken: string): Promise<LoginResponse> {
    if (USE_MOCK) {
      const result: VerifyOtpResponse = {
        token: `mock-apple-token-${Date.now()}`,
        user: MOCK_USER,
        isNewUser: false,
      };
      setAuthToken(result.token);
      return result;
    }
    const result = await api.post<LoginResponse>('/api/auth/apple', { idToken });
    if ('token' in result) setAuthToken(result.token);
    return result;
  },

  async getSession(): Promise<SessionResponse> {
    if (USE_MOCK) {
      const token = getAuthToken();
      if (!token) throw new Error('No session');
      return { user: MOCK_USER, token };
    }
    return api.get<SessionResponse>('/api/auth/session');
  },

  async logout(): Promise<void> {
    if (!USE_MOCK) {
      try {
        await api.post('/api/auth/logout');
      } catch {
        // Session locale nettoyée même si le serveur est injoignable
      }
    }
    clearAuthToken();
    const store = useAppStore.getState();
    store.logout();
  },

  isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
};
