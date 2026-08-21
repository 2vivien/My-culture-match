import type { CurrentUser } from '@/src/types/user';
import usersMock from '@/src/mocks/users.json';
import { api, USE_MOCK } from './api';

const mockTotemUsers = usersMock as Record<string, CurrentUser>;

export const userService = {
  getUserById(id: string): CurrentUser {
    return mockTotemUsers[id] || mockTotemUsers['user-current'];
  },

  async fetchUserById(id: string): Promise<CurrentUser> {
    if (USE_MOCK) {
      return mockTotemUsers[id] || mockTotemUsers['user-current'];
    }
    return api.get<CurrentUser>(`/api/users/${id}`);
  },

  async fetchCurrentUser(): Promise<CurrentUser> {
    if (USE_MOCK) {
      return mockTotemUsers['user-current'];
    }
    return api.get<CurrentUser>('/api/users/me');
  },
};
