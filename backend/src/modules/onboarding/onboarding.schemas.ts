import { z } from 'zod';
import { emailSchema } from '../auth/auth.schemas';

const GENDER = ['male', 'female', 'non-binary', 'prefer-not-to-say'] as const;
const SEEKING = ['friendship', 'love', 'companionship', 'mentorship', 'cultural'] as const;
const INTENTION = ['dating', 'friendship', 'networking', 'marriage', 'mentorship'] as const;

const rootsSchema = z
  .object({
    country: z.string().min(1, 'roots.country est requis'),
    region: z.string().optional(),
    ethnicity: z.string().optional(),
    village: z.string().optional(),
  })
  .strict();

/** POST /api/onboarding — validation stricte (spec Phase 2). */
export const onboardingSchema = z
  .object({
    email: emailSchema,
    name: z.string().trim().min(2, 'Nom : 2 caractères minimum').max(50, 'Nom : 50 caractères maximum'),
    username: z
      .string()
      .trim()
      .min(3, 'Username : 3 caractères minimum')
      .max(30, 'Username : 30 caractères maximum')
      .regex(/^[a-zA-Z0-9._]+$/, 'Username : uniquement lettres, chiffres, . et _'),
    avatarSeed: z.string().max(64).optional(),
    gender: z.enum(GENDER),
    seeking: z.enum(SEEKING),
    birthdate: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), 'Date de naissance invalide'),
    roots: rootsSchema,
    languages: z.array(z.string().trim().min(1)).min(1, 'Au moins une langue'),
    intention: z.enum(INTENTION),
    acceptedTermsAt: z.coerce.date().refine((d) => d.getTime() <= Date.now(), 'acceptedTermsAt doit être ≤ now'),
  })
  .strict();

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type RootsInput = z.infer<typeof rootsSchema>;
