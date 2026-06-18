import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  searchQuery: string;
  activeTab: string;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;
  notificationsCount: number;
  setNotificationsCount: (count: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  searchQuery: '',
  activeTab: 'Feed',
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveTab: (activeTab) => set({ activeTab }),
  notificationsCount: 9,
  setNotificationsCount: (notificationsCount) => set({ notificationsCount }),
}));
