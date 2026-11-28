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
  /** Onglet actif du popup Messages : conversations Love ou Friends. */
  chatScope: 'friends' | 'love';
  setChatScope: (scope: 'friends' | 'love') => void;
  /** Conversations ouvertes depuis Love, à afficher dans l'onglet Love. */
  loveConversationIds: string[];
  markLoveConversation: (id: string) => void;
  openLoveChat: (conversationId?: string) => void;
  /** Popup de connexion ouverte depuis le home en mode visiteur. */
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
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
      openChat: () => set({ isChatOpen: true, chatScope: 'friends' }),
      closeChat: () => set({ isChatOpen: false }),
      chatScope: 'friends',
      setChatScope: (chatScope) => set({ chatScope }),
      loveConversationIds: [],
      markLoveConversation: (id) => set((s) => (
        id && !s.loveConversationIds.includes(id)
          ? { loveConversationIds: [...s.loveConversationIds, id] }
          : s
      )),
      openLoveChat: (conversationId) => set((s) => ({
        isChatOpen: true,
        chatScope: 'love',
        loveConversationIds: conversationId && !s.loveConversationIds.includes(conversationId)
          ? [...s.loveConversationIds, conversationId]
          : s.loveConversationIds,
      })),
      isAuthModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
    }),
    {
      name: 'ui-store',
      // Toujours fermée au rechargement, même si le store est persisté.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<UIState>),
        isAuthModalOpen: false,
        chatScope: 'friends',
      }),
    },
  )
);
