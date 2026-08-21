import { z } from 'zod';

/** Occupation professionnelle (domaine + titre). */
const occupationSchema = z
  .object({
    domain: z.string().trim().min(1, 'Domaine requis').max(50),
    title: z.string().trim().min(1, 'Titre requis').max(100),
  })
  .strict();

/**
 * PATCH /api/users/me — mise à jour champ par champ des détails du profil
 * (ProfileDetails). Tous les champs sont optionnels ; chaque champ présent
 * est validé individuellement.
 */
export const profilePatchSchema = z
  .object({
    occupation: occupationSchema.optional(),
    values: z.array(z.string().trim().min(1).max(50)).max(12).optional(),
    preference: z.string().trim().max(100).optional(),
    diaspora: z.string().trim().max(100).optional(),
    familyQuiz: z.string().trim().max(100).optional(),
    situation: z.string().trim().max(100).optional(),
    criteria: z.array(z.string().trim().min(1).max(50)).max(13).optional(),
    bio: z
      .string()
      .trim()
      .min(10, 'La bio doit contenir au moins 10 caractères')
      .max(500, 'La bio ne peut pas dépasser 500 caractères')
      .optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Au moins un champ à mettre à jour est requis',
  });

export type ProfilePatchInput = z.infer<typeof profilePatchSchema>;
