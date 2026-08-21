import { create } from 'zustand';

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
  setNotificationsCount: (count: number) => void;
  showCreateTribeModal: boolean;
  setShowCreateTribeModal: (show: boolean) => void;
  likedPosts: Set<string>;
  toggleLikedPost: (postId: string) => void;
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  isSidebarCollapsed: false,
  searchQuery: '',
  activeTab: 'Feed',
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleSidebarCollapse: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveTab: (activeTab) => set({ activeTab, isSidebarCollapsed: false }),
  notificationsCount: 9,
  setNotificationsCount: (notificationsCount) => set({ notificationsCount }),
  showCreateTribeModal: false,
  setShowCreateTribeModal: (showCreateTribeModal) => set({ showCreateTribeModal }),
  likedPosts: new Set(),
  toggleLikedPost: (postId) => set((s) => {
    const next = new Set(s.likedPosts)
    if (next.has(postId)) next.delete(postId)
    else next.add(postId)
    return { likedPosts: next }
  }),
  isChatOpen: false,
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),
}));
