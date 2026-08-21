import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { onboardingSchema } from './onboarding.schemas';
import { completeOnboarding } from './onboarding.service';
import { AppError } from '../../shared/utils/AppError';

/**
 * POST /api/onboarding — complète le profil en 7 étapes.
 * L'utilisateur doit être authentifié (session OTP/OAuth déjà ouverte) ;
 * l'email du body doit correspondre à l'email de la session.
 */
export const onboardingModule = new Hono();

onboardingModule.post('/', requireAuth, zValidator('json', onboardingSchema), async (c) => {
  const { email } = c.req.valid('json');
  const auth = c.get('auth');

  if (email !== auth.email) {
    throw AppError.forbidden(
      'L’email doit correspondre à votre compte connecté',
      'EMAIL_MISMATCH',
    );
  }

  const payload = c.req.valid('json');
  const user = await completeOnboarding(payload);
  return c.json({ success: true, user }, 201);
});
