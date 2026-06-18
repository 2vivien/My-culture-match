import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@/src/types/user';

interface AppState {
  theme: 'light' | 'dark';
  locale: string;
  feedSort: string;
  feedCulture: string;
  currentUser: CurrentUser;
  selectedTotemUserId: string;
  toggleTheme: () => void;
  setLocale: (locale: string) => void;
  setFeedSort: (sort: string) => void;
  setFeedCulture: (culture: string) => void;
  setSelectedTotemUserId: (id: string) => void;
}

const defaultUser: CurrentUser = {
  id: 'user-current',
  name: 'Amal',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  locale: 'English',
  level: 24,
  glow: 'orange',
  location: 'Benin',
  tribes: ['Fon', 'Yoruba', 'Adja'],
  traditionsCount: 18,
  culturesCount: 32,
  tribesCount: 4,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'English',
      feedSort: 'Best',
      feedCulture: 'Everywhere',
      currentUser: defaultUser,
      selectedTotemUserId: 'user-current',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLocale: (locale) => set({ locale }),
      setFeedSort: (feedSort) => set({ feedSort }),
      setFeedCulture: (feedCulture) => set({ feedCulture }),
      setSelectedTotemUserId: (id) => set({ selectedTotemUserId: id }),
    }),
    { name: 'app-store' }
  )
);
