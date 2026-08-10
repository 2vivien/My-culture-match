import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../../config/env';
import { AppError } from '../../shared/utils/AppError';

// ── Fournisseurs OAuth ─────────────────────────────────────
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

const googleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
const appleJwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL));

export type OAuthProvider = 'google' | 'apple';

export interface VerifiedIdToken {
  sub: string; // providerAccountId
  email: string;
  name?: string;
  emailVerified: boolean;
}

/**
 * Vérifie la signature d'un idToken OAuth (Google ou Apple) via les clés JWKS
 * officielles du fournisseur. Rejette tout token falsifié ou non signé par le
 * fournisseur, ou dont l'audience ne correspond pas à l'app.
 */
export async function verifyIdToken(
  provider: OAuthProvider,
  idToken: string,
): Promise<VerifiedIdToken> {
  const jwks = provider === 'google' ? googleJwks : appleJwks;
  const audience =
    provider === 'google' ? env.GOOGLE_CLIENT_ID : env.APPLE_CLIENT_ID;

  if (!audience) {
    throw AppError.conflict(`Fournisseur ${provider} non configuré côté serveur`);
  }

  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      algorithms: provider === 'google' ? ['RS256'] : ['RS256', 'ES256'],
      audience,
    });

    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    if (!email || !payload.sub) {
      throw new Error('idToken sans email/sub');
    }

    return {
      sub: payload.sub,
      email,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      emailVerified: payload.email_verified === true,
    };
  } catch {
    throw AppError.unauthorized('idToken invalide ou falsifié', 'INVALID_ID_TOKEN');
  }
}
