import { z } from 'zod';

export interface OnboardingRoots {
  country: string;
  region: string;
  ethnicity: string;
  village: string;
}

export interface OnboardingOccupation {
  domain: string;
  title: string;
}

export interface OnboardingData {
  intention: string;
  gender: string;
  seeking: string;
  name: string;
  username: string;
  birthdate: string;
  age: number;
  avatarSeed: string;
  roots: OnboardingRoots;
  occupation: OnboardingOccupation;
  values: string[];
  languages: string[];
  preference: string;
  diaspora: string;
  familyQuiz: string;
  situation: string;
  criteria: string[];
  bio: string;
}

export type ProfileDetails = Pick<
  OnboardingData,
  | 'occupation'
  | 'values'
  | 'preference'
  | 'diaspora'
  | 'familyQuiz'
  | 'situation'
  | 'criteria'
  | 'bio'
>;

export const defaultProfileDetails: ProfileDetails = {
  occupation: { domain: '', title: '' },
  values: [],
  preference: '',
  diaspora: '',
  familyQuiz: '',
  situation: '',
  criteria: [],
  bio: '',
};

export function isProfileDetailFilled(field: keyof ProfileDetails, value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') {
    return !!((value as { domain?: string }).domain ?? '').trim();
  }
  if (field === 'bio') return typeof value === 'string' && value.trim().length >= 10;
  return typeof value === 'string' && value.trim().length > 0;
}

export type UpdateField = <K extends keyof OnboardingData>(
  field: K,
  value: OnboardingData[K]
) => void;

export const onboardingDataSchema = z.object({
  gender: z.string().min(1, 'Sélectionnez votre genre'),
  seeking: z.string().min(1, 'Indiquez qui vous cherchez'),
  name: z.string().trim().min(2, 'Votre prénom doit contenir au moins 2 caractères'),
  username: z
    .string()
    .trim()
    .min(3, 'Votre pseudo doit contenir au moins 3 caractères')
    .regex(/^[a-zA-Z0-9._]+$/, 'Lettres, chiffres, points et underscores uniquement'),
  birthdate: z.string().min(1, 'Indiquez votre date de naissance'),
  age: z.number().min(16, 'Vous devez avoir au moins 16 ans'),
  avatarSeed: z.string(),
  roots: z.object({
    country: z.string().trim().min(1, 'Indiquez votre pays'),
    region: z.string().trim().min(1, 'Indiquez votre région'),
    ethnicity: z.string().trim().min(1, 'Indiquez votre ethnie'),
    village: z.string(),
  }),
  languages: z.array(z.string()).min(1, 'Sélectionnez au moins une langue'),
  intention: z.string().min(1, 'Choisissez une intention pour commencer'),
  // Champs déplacés dans le profil (complétion) : optionnels à l'onboarding
  occupation: z.object({ domain: z.string(), title: z.string() }).optional(),
  values: z.array(z.string()).optional(),
  preference: z.string().optional(),
  diaspora: z.string().optional(),
  familyQuiz: z.string().optional(),
  situation: z.string().optional(),
  criteria: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

const stepSchemas: Record<number, z.ZodType> = {
  1: onboardingDataSchema.pick({ name: true, username: true, avatarSeed: true }),
  2: onboardingDataSchema.pick({ gender: true, seeking: true }),
  3: onboardingDataSchema.pick({ birthdate: true, age: true }),
  4: onboardingDataSchema.pick({ roots: true }),
  5: onboardingDataSchema.pick({ languages: true }),
  6: onboardingDataSchema.pick({ intention: true }),
};

export function validateStep(step: number, data: OnboardingData): boolean {
  const schema = stepSchemas[step];
  if (!schema) return true;
  return schema.safeParse(data).success;
}
