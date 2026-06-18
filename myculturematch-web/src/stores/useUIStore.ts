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
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  isSidebarCollapsed: false,
  searchQuery: '',
  activeTab: 'Feed',
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleSidebarCollapse: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveTab: (activeTab) => set({ activeTab }),
  notificationsCount: 9,
  setNotificationsCount: (notificationsCount) => set({ notificationsCount }),
}));
