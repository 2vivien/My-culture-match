import { api } from './api';
import { getAuthToken, setAuthToken, clearAuthToken } from './auth.token';
import { userService } from './userService';
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

export const authService = {
  restoreSession(): boolean {
    const token = getAuthToken();
    if (!token) return false;

    this.getSession()
      .then((session) => {
        const store = useAppStore.getState();
        store.loginUser({
          id: session.user.id,
          name: session.user.name ?? session.user.email,
          username: session.user.username ?? session.user.email.split('@')[0] ?? 'user',
          avatar: session.user.avatar ?? undefined,
        });
        // Le profil complet (username à jour, pays, tribus…) vient de /api/users/me
        userService
          .fetchCurrentUser()
          .then((me) =>
            store.loginUser({
              name: me.name,
              username: me.username,
              avatar: me.avatar ?? undefined,
              location: me.location ?? '',
              country: me.country ?? '',
              level: me.level,
              tribes: me.tribes ?? [],
              role: me.role,
            }),
          )
          .catch(() => undefined);
        store.setAuthenticated(true);
        store.setOnboarded(true);
      })
      .catch(() => {
        clearAuthToken();
      });

    return true;
  },

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
    }
    clearAuthToken();
    const store = useAppStore.getState();
    store.logout();
  },

  isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
};
