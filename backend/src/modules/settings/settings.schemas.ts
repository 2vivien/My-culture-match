import { z } from 'zod';
import { emailSchema } from '../auth/auth.schemas';

export const LOCATION_TYPES = ['precise', 'approximate', 'hidden'] as const;
export const THEMES = ['light', 'dark', 'system'] as const;

/** GET /api/settings → renvoyé par le service (pas de body). */

/** PUT /api/settings — mise à jour partielle des préférences. */
export const settingsPatchSchema = z
  .object({
    email: emailSchema.optional(),
    gender: z.string().trim().max(30).optional(),
    locationType: z.enum(LOCATION_TYPES).optional(),
    theme: z.enum(THEMES).optional(),
    language: z.string().trim().min(2).max(10).optional(),
    notificationsEnabled: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Au moins un champ requis' });

export type SettingsPatchInput = z.infer<typeof settingsPatchSchema>;

/** POST /api/settings/2fa/start — démarrer l'activation 2FA. */
export const twoFactorStartSchema = z.object({}).strict();

/** POST /api/settings/2fa/verify — confirmer avec un code TOTP. */
export const twoFactorVerifySchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, 'Code à 6 chiffres requis'),
  })
  .strict();

/** POST /api/settings/2fa/disable — désactiver la 2FA (code requis). */
export const twoFactorDisableSchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, 'Code à 6 chiffres requis'),
  })
  .strict();

/** POST /api/settings/email/request — demande de changement d'email. */
export const emailChangeRequestSchema = z
  .object({
    newEmail: emailSchema,
  })
  .strict();

/** POST /api/settings/email/change — confirmation avec le code reçu. */
export const emailChangeSchema = z
  .object({
    newEmail: emailSchema,
    code: z.string().trim().regex(/^\d{6}$/, 'Code de confirmation requis'),
  })
  .strict();
