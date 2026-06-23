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

const mockSuggestions: ConnectionUser[] = [
  { id: 's1', name: 'Keisuke', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80', matchScore: 98, country: 'Japon', countryFlag: '🇯🇵', countryCode: 'JP', interestedCount: 125, compagnonsCount: 48, interests: ['Shinto Rituals', 'Ancestral Art'], age: 25, gender: 'male' },
  { id: 's2', name: 'Zara Maori', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', matchScore: 91, country: 'New Zealand', countryFlag: '🇳🇿', countryCode: 'NZ', interestedCount: 84, compagnonsCount: 32, interests: ['Haka Legends', 'Maori Art'], age: 23, gender: 'female' },
  { id: 's3', name: 'Caleb Norse', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', matchScore: 88, country: 'Norway', countryFlag: '🇳🇴', countryCode: 'NO', interestedCount: 62, compagnonsCount: 19, interests: ['Runes & Sagas', 'Woodcarving'], age: 26, gender: 'male' },
];

const mockInterested: ConnectionUser[] = [
  { id: 'i1', name: 'Elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', matchScore: 92, country: 'Spain', countryFlag: '🇪🇸', countryCode: 'ES', interestedCount: 150, compagnonsCount: 60, interests: ['Ainu Folklore', 'Tea Ceremonies'], age: 25, gender: 'female' },
  { id: 'i2', name: 'Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', matchScore: 85, country: 'China', countryFlag: '🇨🇳', countryCode: 'CN', interestedCount: 300, compagnonsCount: 120, interests: ['Calligraphy', 'Zen Gardens'], age: 28, gender: 'male' },
];

const mockDemandes: ConnectionUser[] = [
  { id: 'd1', name: 'Amara', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', matchScore: 95, country: 'Senegal', countryFlag: '🇸🇳', countryCode: 'SN', interestedCount: 195, compagnonsCount: 77, interests: ['Afrobeat', 'Textile Arts'], age: 24, gender: 'female' },
  { id: 'd2', name: 'Liam', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', matchScore: 78, country: 'Ireland', countryFlag: '🇮🇪', countryCode: 'IE', interestedCount: 84, compagnonsCount: 36, interests: ['Celtic Lore', 'Folk Music'], age: 27, gender: 'male' },
  { id: 'd3', name: 'Sofia', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', matchScore: 88, country: 'Mexico', countryFlag: '🇲🇽', countryCode: 'MX', interestedCount: 220, compagnonsCount: 89, interests: ['Dia de Muertos', 'Alebrijes'], age: 22, gender: 'female' },
];

const mockCompagnons: ConnectionUser[] = [
  { id: 'c1', name: 'Yuki', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', matchScore: 98, country: 'Japan', countryFlag: '🇯🇵', countryCode: 'JP', interestedCount: 450, compagnonsCount: 89, online: true, age: 23, gender: 'female' },
  { id: 'c2', name: 'Mateo', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80', matchScore: 92, country: 'Spain', countryFlag: '🇪🇸', countryCode: 'ES', interestedCount: 80, compagnonsCount: 42, online: true, age: 26, gender: 'male' },
  { id: 'c3', name: 'Chloe Yu', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', matchScore: 98, country: 'USA', countryFlag: '🇺🇸', countryCode: 'US', interestedCount: 180, compagnonsCount: 92, online: false, age: 22, gender: 'female' },
];

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
