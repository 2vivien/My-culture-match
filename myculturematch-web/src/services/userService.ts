import type { CurrentUser } from '@/src/types/user';
import usersMock from '@/src/mocks/users.json';

const mockTotemUsers = usersMock as Record<string, CurrentUser>;

export const userService = {
  getUserById(id: string): CurrentUser {
    return mockTotemUsers[id] || mockTotemUsers['user-current'];
  },
};
