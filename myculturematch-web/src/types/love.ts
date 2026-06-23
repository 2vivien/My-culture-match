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
}

export interface LoveFilters {
  origin: string;
  location: string;
  distance: string;
  ageRange: [number, number];
  gender: 'Hommes' | 'Femmes' | 'Tout le monde';
}
