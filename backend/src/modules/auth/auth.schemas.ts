import { z } from 'zod';

/** Normalise un email : trim + lowercase + regex RFC 5322 simplifiée. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Email trop court')
  .max(254, 'Email trop long')
  .regex(EMAIL_REGEX, 'Format d’email invalide');

/** POST /api/auth/send-otp */
export const sendOtpSchema = z.object({
  email: emailSchema,
});

/** POST /api/auth/verify-otp */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .regex(/^\d{6}$/, 'Code invalide : 6 chiffres requis'),
});

/** POST /api/auth/google | /apple */
export const oauthSchema = z.object({
  idToken: z.string().min(10, 'idToken invalide'),
});

/** POST /api/auth/2fa/verify */
export const twoFactorVerifySchema = z.object({
  ticket: z.string().min(10, 'ticket invalide'),
  code: z
    .string()
    .regex(/^\d{6}$/, 'Code invalide : 6 chiffres requis'),
});

/** POST /api/auth/login/switch-otp — bascule un email OTP vers OAuth (same-origin). */
export const switchOtpToOAuthSchema = z.object({
  email: emailSchema,
  method: z.enum(['google', 'apple']),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type SwitchOtpToOAuthInput = z.infer<typeof switchOtpToOAuthSchema>;
