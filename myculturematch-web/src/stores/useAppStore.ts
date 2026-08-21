import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@/src/types/user';
import {
  defaultProfileDetails,
  type ProfileDetails,
} from '@/src/lib/onboarding.schemas';

interface AppState {
  theme: 'light' | 'dark';
  locale: string;
  feedSort: string;
  feedCulture: string;
  currentUser: CurrentUser;
  selectedTotemUserId: string;
  selectedTribeId: string | null;
  profileActiveTab: 'Posts' | 'Photos' | 'Videos' | 'Traditions' | 'About' | 'Saves';
  isAuthenticated: boolean;
  isOnboarded: boolean;
  email: string;
  profileDetails: ProfileDetails;
  toggleTheme: () => void;
  setLocale: (locale: string) => void;
  setFeedSort: (sort: string) => void;
  setFeedCulture: (culture: string) => void;
  setSelectedTotemUserId: (id: string) => void;
  setSelectedTribeId: (id: string | null) => void;
  setProfileActiveTab: (tab: 'Posts' | 'Photos' | 'Videos' | 'Traditions' | 'About' | 'Saves') => void;
  setAuthenticated: (auth: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  setEmail: (email: string) => void;
  updateProfileDetail: <K extends keyof ProfileDetails>(field: K, value: ProfileDetails[K]) => void;
  resetProfileDetails: () => void;
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
  selectedTribeId: null,
      profileActiveTab: 'Posts',
      isAuthenticated: false,
      isOnboarded: false,
      email: '',
      profileDetails: defaultProfileDetails,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLocale: (locale) => set({ locale }),
      setFeedSort: (feedSort) => set({ feedSort }),
      setFeedCulture: (feedCulture) => set({ feedCulture }),
      setSelectedTotemUserId: (id) => set({ selectedTotemUserId: id }),
  setSelectedTribeId: (id) => set({ selectedTribeId: id }),
      setProfileActiveTab: (profileActiveTab) => set({ profileActiveTab }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setOnboarded: (isOnboarded) => set({ isOnboarded }),
      setEmail: (email) => set({ email }),
      updateProfileDetail: (field, value) => set((state) => ({
        profileDetails: { ...state.profileDetails, [field]: value },
      })),
      resetProfileDetails: () => set({ profileDetails: defaultProfileDetails }),
      loginUser: (user) => set((state) => ({
        isAuthenticated: true,
        currentUser: { ...state.currentUser, ...user }
      })),
      logout: () => set({ isAuthenticated: false, isOnboarded: false, profileDetails: defaultProfileDetails }),
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
