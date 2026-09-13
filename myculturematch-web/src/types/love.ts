export interface LoveMatch {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'non-binary';
  country: string;
  flag: string;
  avatar: string;
  matchScore: number;
  online: boolean;
  interest: string;
  about: string;
  tribes?: string[];
  languages?: string[];
}

export interface LoveFilters {
  origin: string;
  location: string;
  distance: string;
  ageRange: [number, number];
  gender: 'Hommes' | 'Femmes' | 'Tout le monde';
}

export interface LoveSearchBreakdown {
  values: number;
  goals: number;
  language: number;
  culture: number;
  interests: number;
}

export interface LoveSearchResult extends LoveMatch {
  rank: number;
  reasons: string[];
  breakdown: LoveSearchBreakdown;
}

export interface LoveSearchResponse {
  query: string;
  criteria: Record<string, unknown>;
  results: LoveSearchResult[];
  remainingSearches: number;
}

export interface LoveSearchQuota {
  limit: number;
  used: number;
  remaining: number;
}
