import { api } from './api';
import type { OnboardingData } from '@/src/lib/onboarding.schemas';

export const DOMAINS = [
  { id: 'tech', label: 'Tech & Digital' },
  { id: 'business', label: 'Business & Finance' },
  { id: 'creative', label: 'Art & Design' },
  { id: 'medical', label: 'Santé & Social' },
  { id: 'other', label: 'Autre domaine' },
];

export const VALUES = [
  { id: 'faith', label: 'Foi & Spiritualité' },
  { id: 'family', label: 'Famille d\'abord' },
  { id: 'ambition', label: 'Ambition & Réussite' },
  { id: 'post', label: 'Post & Coutumes' },
  { id: 'solidarity', label: 'Solidarité' },
  { id: 'comm', label: 'Communication' },
  { id: 'peace', label: 'Paix & Équilibre' },
  { id: 'indep', label: 'Indépendance' },
  { id: 'loyalty', label: 'Loyauté absolue' },
  { id: 'freedom', label: 'Liberté' },
  { id: 'edu', label: 'Éducation' },
  { id: 'health', label: 'Santé' }
];

export const LANGUAGES = {
  intl: ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Portugais'],
  africa: ['Wolof', 'Bambara', 'Soninké', 'Peul', 'Yoruba', 'Igbo', 'Haoussa', 'Twi', 'Éwé', 'Lingala', 'Moore', 'Bamiléké', 'Swahili'],
  diaspora: ['Créole haïtien', 'Créole antillais']
};

export const CRITERIA = [
  'Communication', 'Respect mutuel', 'Foi partagée', 'Ambition commune',
  'Humour', 'Stabilité financière', 'Tendresse', 'Honnêteté',
  'Passion', 'Autonomie', 'Projet familial', 'Culture', 'Proximité'
];

export function generateUsernameSuggestions(fullName: string): string[] {
  if (!fullName) return [];
  const clean = fullName.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];

  const p1 = parts[0];
  const p2 = parts[1] || '';

  const suggestions: string[] = [];
  if (p2) {
    suggestions.push(`${p1}.${p2}`);
    suggestions.push(`${p1}_${p2}_${Math.floor(Math.random() * 90) + 10}`);
    suggestions.push(`${p2}_${p1}`);
  } else {
    suggestions.push(`${p1}_mcm`);
    suggestions.push(`${p1}.${Math.floor(Math.random() * 900) + 100}`);
    suggestions.push(`iam_${p1}`);
  }
  return Array.from(new Set(suggestions)).slice(0, 3);
}

export function calculateAge(birthdateStr: string): number {
  if (!birthdateStr) return 0;
  const today = new Date();
  const birthDate = new Date(birthdateStr);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export interface OnboardingSubmitPayload extends OnboardingData {
  email?: string;
  acceptedTermsAt: string | null;
}

const GENDER_MAP: Record<string, string> = {
  Homme: 'male',
  Femme: 'female',
  Autre: 'prefer-not-to-say',
};

const INTENTION_MAP: Record<string, string> = {
  union: 'marriage',
  culture: 'friendship',
  discover: 'networking',
  explore: 'friendship',
};

const INTENTION_TO_SEEKING: Record<string, string> = {
  union: 'love',
  culture: 'cultural',
  discover: 'cultural',
  explore: 'friendship',
};

export function toOnboardingApiPayload(data: OnboardingSubmitPayload) {
  if (!data.email) throw new Error('Adresse email manquante.');
  if (!data.acceptedTermsAt) throw new Error('Vous devez accepter les conditions générales.');

  const gender = GENDER_MAP[data.gender];
  if (!gender) throw new Error('Genre invalide.');

  return {
    email: data.email,
    name: data.name,
    username: data.username,
    avatarSeed: data.avatarSeed,
    gender,
    seeking: INTENTION_TO_SEEKING[data.intention],
    birthdate: data.birthdate,
    roots: data.roots,
    languages: data.languages,
    intention: INTENTION_MAP[data.intention],
    acceptedTermsAt: data.acceptedTermsAt,
  };
}

export interface OnboardingSubmitResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    avatar: string | null;
    avatarSeed: string | null;
    level: number;
    xp: number;
    glow: string;
    profileCompleted: boolean;
  };
}

export async function submitProfile(
  data: OnboardingSubmitPayload
): Promise<OnboardingSubmitResult> {
  return api.post<OnboardingSubmitResult>('/api/onboarding', toOnboardingApiPayload(data));
}
