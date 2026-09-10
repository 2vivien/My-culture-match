import type { CurrentUser } from '@/src/types/user';
import { api } from './api';

export const userService = {
  async fetchUserById(id: string): Promise<CurrentUser> {
    return api.get<CurrentUser>(`/api/users/${id}`);
  },

  async fetchCurrentUser(): Promise<CurrentUser> {
    return api.get<CurrentUser>('/api/users/me');
  },
};
