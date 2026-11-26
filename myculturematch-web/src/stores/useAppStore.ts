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
  selectedProfileUserId: string;
  selectedTribeId: string | null;
  /** Publication ouverte dans la page détail (#/post/:id). */
  selectedPostId: string | null;
  profileActiveTab: 'Posts' | 'Comments' | 'Saved';
  isAuthenticated: boolean;
  isOnboarded: boolean;
  email: string;
  profileDetails: ProfileDetails;
  toggleTheme: () => void;
  setLocale: (locale: string) => void;
  setFeedSort: (sort: string) => void;
  setFeedCulture: (culture: string) => void;
  setSelectedProfileUserId: (id: string) => void;
  setSelectedTribeId: (id: string | null) => void;
  setSelectedPostId: (id: string | null) => void;
  setProfileActiveTab: (tab: 'Posts' | 'Comments' | 'Saved') => void;
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
  name: 'Utilisateur',
  username: 'user',
  avatar: '',
  locale: 'fr',
  level: 1,
  glow: 'orange',
  location: '',
  country: '',
  tribes: [],
  postsCount: 0,
  culturesCount: 0,
  tribesCount: 0,
  interestedCount: 0,
  companionsCount: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'English',
      feedSort: 'Best',
      feedCulture: 'Toutes les thématiques',
      currentUser: defaultUser,
      selectedProfileUserId: 'user-current',
  selectedTribeId: null,
  selectedPostId: null,
  setSelectedPostId: (selectedPostId) => set({ selectedPostId }),
      profileActiveTab: 'Posts',
      isAuthenticated: false,
      isOnboarded: false,
      email: '',
      profileDetails: defaultProfileDetails,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLocale: (locale) => set({ locale }),
      setFeedSort: (feedSort) => set({ feedSort }),
      setFeedCulture: (feedCulture) => set({ feedCulture }),
      setSelectedProfileUserId: (id) => set({ selectedProfileUserId: id }),
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
      logout: () => set({ isAuthenticated: false, isOnboarded: false, profileDetails: defaultProfileDetails, currentUser: defaultUser }),
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
