import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  searchQuery: string;
  activeTab: string;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;
  notificationsCount: number;
  setNotificationsCount: (count: number | ((prev: number) => number)) => void;
  showCreateTribeModal: boolean;
  setShowCreateTribeModal: (show: boolean) => void;
  /** Message d'erreur de création de tribu (nom/tag déjà pris, limite atteinte…). */
  tribeCreateError: string | null;
  setTribeCreateError: (error: string | null) => void;
  likedPosts: string[];
  toggleLikedPost: (postId: string) => void;
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
      isSidebarCollapsed: false,
      searchQuery: '',
      activeTab: 'Feed',
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      toggleSidebarCollapse: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setActiveTab: (activeTab) => set({ activeTab, isSidebarCollapsed: false }),
      notificationsCount: 0,
      setNotificationsCount: (notificationsCount) =>
        set((s) => {
          const next =
            typeof notificationsCount === 'function' ? notificationsCount(s.notificationsCount) : notificationsCount;
          // Inchangé : on retourne le même état → zustand n'informe personne (pas de boucle).
          return next === s.notificationsCount ? s : { notificationsCount: next };
        }),
      showCreateTribeModal: false,
      setShowCreateTribeModal: (showCreateTribeModal) => set({ showCreateTribeModal }),
      tribeCreateError: null,
      setTribeCreateError: (tribeCreateError) => set({ tribeCreateError }),
      likedPosts: [],
      toggleLikedPost: (postId) => set((s) => {
        const has = s.likedPosts.includes(postId);
        return {
          likedPosts: has
            ? s.likedPosts.filter((id) => id !== postId)
            : [...s.likedPosts, postId],
        };
      }),
      isChatOpen: false,
      openChat: () => set({ isChatOpen: true }),
      closeChat: () => set({ isChatOpen: false }),
    }),
    { name: 'ui-store' },
  )
);
