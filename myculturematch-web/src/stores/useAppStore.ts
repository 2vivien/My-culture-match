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
  profileActiveTab: 'Posts' | 'Photos' | 'Videos' | 'Traditions' | 'About' | 'Saves';
  isAuthenticated: boolean;
  isOnboarded: boolean;
  toggleTheme: () => void;
  setLocale: (locale: string) => void;
  setFeedSort: (sort: string) => void;
  setFeedCulture: (culture: string) => void;
  setSelectedTotemUserId: (id: string) => void;
  setProfileActiveTab: (tab: 'Posts' | 'Photos' | 'Videos' | 'Traditions' | 'About' | 'Saves') => void;
  setAuthenticated: (auth: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  loginUser: (user: Partial<CurrentUser>) => void;
  logout: () => void;
  joinTribe: (tribeName: string) => void;
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
  interestedCount: 125,
  companionsCount: 48,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'English',
      feedSort: 'Best',
      feedCulture: 'Toutes les thématiques',
      currentUser: defaultUser,
      selectedTotemUserId: 'user-current',
      profileActiveTab: 'Posts',
      isAuthenticated: false,
      isOnboarded: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLocale: (locale) => set({ locale }),
      setFeedSort: (feedSort) => set({ feedSort }),
      setFeedCulture: (feedCulture) => set({ feedCulture }),
      setSelectedTotemUserId: (id) => set({ selectedTotemUserId: id }),
      setProfileActiveTab: (profileActiveTab) => set({ profileActiveTab }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setOnboarded: (isOnboarded) => set({ isOnboarded }),
      loginUser: (user) => set((state) => ({
        isAuthenticated: true,
        isOnboarded: true,
        currentUser: { ...state.currentUser, ...user }
      })),
      logout: () => set({ isAuthenticated: false, isOnboarded: false }),
      joinTribe: (tribeName) => set((s) => ({
        currentUser: {
          ...s.currentUser,
          tribes: s.currentUser.tribes.includes(tribeName)
            ? s.currentUser.tribes
            : [...s.currentUser.tribes, tribeName],
          tribesCount: s.currentUser.tribes.includes(tribeName)
            ? s.currentUser.tribesCount
            : s.currentUser.tribesCount + 1
        }
      })),
    }),
    { name: 'app-store' }
  )
);
