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
    name: z.string().trim().min(2, 'Nom : 2 caractères minimum').max(50).optional(),
    /** Photo de profil / bannière : URL publique (MinIO) produite par /api/uploads. */
    avatar: z.string().trim().url('URL avatar invalide').max(2048).optional(),
    banner: z.string().trim().url('URL bannière invalide').max(2048).optional(),
    location: z.string().trim().max(100).optional(),
    country: z.string().trim().max(80).optional(),
    region: z.string().trim().max(80).optional(),
    ethnicity: z.string().trim().max(80).optional(),
    village: z.string().trim().max(80).optional(),
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

/**
 * PATCH /api/users/me/location — partage de position (style Snap Map).
 * { latitude, longitude } active le partage ; { enabled: false } le désactive.
 */
export const locationUpdateSchema = z
  .object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    enabled: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => v.enabled === false || (typeof v.latitude === 'number' && typeof v.longitude === 'number'),
    { message: 'latitude et longitude sont requis pour activer le partage' },
  );

export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
