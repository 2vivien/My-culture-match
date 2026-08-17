import { api } from './api';
import { setAuthToken, clearAuthToken } from './auth.token';

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

export const authService = {
  async sendOtp(email: string): Promise<{ success: boolean; cooldown: number }> {
    return api.post<{ success: boolean; cooldown: number }>('/api/auth/send-otp', { email });
  },

  async verifyOtp(email: string, code: string): Promise<LoginResponse> {
    const result = await api.post<LoginResponse>('/api/auth/verify-otp', { email, code });
    if ('token' in result) setAuthToken(result.token);
    return result;
  },

  async verifyTwoFactor(ticket: string, code: string): Promise<VerifyOtpResponse> {
    const result = await api.post<VerifyOtpResponse>('/api/auth/2fa/verify', { ticket, code });
    setAuthToken(result.token);
    return result;
  },

  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    const result = await api.post<LoginResponse>('/api/auth/google', { idToken });
    if ('token' in result) setAuthToken(result.token);
    return result;
  },

  async loginWithApple(idToken: string): Promise<LoginResponse> {
    const result = await api.post<LoginResponse>('/api/auth/apple', { idToken });
    if ('token' in result) setAuthToken(result.token);
    return result;
  },

  async getSession(): Promise<SessionResponse> {
    return api.get<SessionResponse>('/api/auth/session');
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Session locale nettoyée même si le serveur est injoignable
    } finally {
      clearAuthToken();
    }
  },
};
