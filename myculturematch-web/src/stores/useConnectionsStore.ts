import { create } from 'zustand';

export interface ConnectionUser {
  id: string;
  name: string;
  avatar: string;
  matchScore: number;
  country: string;
  countryFlag: string;
  countryCode: string;
  interestedCount: number;
  compagnonsCount: number;
  interests?: string[];
  online?: boolean;
  age?: number;
  gender?: 'female' | 'male' | 'non-binary';
  isConnected?: boolean;
}

interface ConnectionsState {
  activeSubTab: 'Suggestions' | 'Interested' | 'Demandes' | 'Compagnons';
  suggestions: ConnectionUser[];
  interested: ConnectionUser[];
  demandes: ConnectionUser[];
  compagnons: ConnectionUser[];
  setActiveSubTab: (tab: 'Suggestions' | 'Interested' | 'Demandes' | 'Compagnons') => void;
  sendRequest: (id: string) => void;
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
}

import connectionsMock from '@/src/mocks/connections.json';

const mockSuggestions = connectionsMock.suggestions as ConnectionUser[];
const mockInterested = connectionsMock.interested as ConnectionUser[];
const mockDemandes = connectionsMock.demandes as ConnectionUser[];
const mockCompagnons = connectionsMock.compagnons as ConnectionUser[];

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  activeSubTab: 'Suggestions',
  suggestions: mockSuggestions,
  interested: mockInterested,
  demandes: mockDemandes,
  compagnons: mockCompagnons,
  setActiveSubTab: (activeSubTab) => set({ activeSubTab }),
  sendRequest: (id) => set((s) => ({
    suggestions: s.suggestions.filter((u) => u.id !== id),
    interested: s.interested.filter((u) => u.id !== id),
  })),
  acceptRequest: (id) => set((s) => {
    const targetUser = s.demandes.find((u) => u.id === id);
    if (!targetUser) return {};
    return {
      demandes: s.demandes.filter((u) => u.id !== id),
      compagnons: [...s.compagnons, { ...targetUser, online: true }],
    };
  }),
  declineRequest: (id) => set((s) => ({
    demandes: s.demandes.filter((u) => u.id !== id),
  })),
}));
