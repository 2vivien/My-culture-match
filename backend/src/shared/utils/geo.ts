/**
 * Détection de localisation approximative par IP.
 * Utilise ip-api.com (gratuit, sans clé, 45 req/min) — silencieux en cas d'échec.
 */
import { db, schema } from '../../infrastructure/database';
import { eq } from 'drizzle-orm';

export interface GeoLookup {
  country?: string;
  city?: string;
}

const lookupCacheKey = (ip: string) => `geo:ip:${ip}`;

/** Résout une IP en pays/ville via ip-api.com (cache Redis 24h). */
export async function lookupGeoByIp(ip: string): Promise<GeoLookup | null> {
  if (!ip || ip === 'unknown') return null;
  // Adresses privées / loopback : pas de lookup
  if (/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|localhost)/.test(ip)) return null;

  try {
    const { redis } = await import('../../infrastructure/redis');
    const cached = await redis.get(lookupCacheKey(ip));
    if (cached) {
      const parsed = JSON.parse(cached) as GeoLookup;
      return parsed;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as { status: string; country?: string; city?: string };
    if (data.status !== 'success') return null;

    const geo: GeoLookup = { country: data.country, city: data.city };
    await redis.set(lookupCacheKey(ip), JSON.stringify(geo), 'EX', 24 * 60 * 60);
    return geo;
  } catch {
    // Silencieux : la géoloc IP est best-effort
    return null;
  }
}

/**
 * Détection silencieuse : si le compte n'a pas encore de localisation,
 * on pré-remplit `location` (Ville, Pays) avec le résultat IP.
 * Jamais bloquant : toute erreur est ignorée.
 */
export async function detectLocationForUser(userId: string, ip?: string): Promise<void> {
  if (!ip) return;
  try {
    const [user] = await db
      .select({ id: schema.users.id, location: schema.users.location })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    if (!user || user.location) return; // déjà défini (ou onboarding qui le fixera)

    const geo = await lookupGeoByIp(ip);
    if (!geo?.country) return;

    const location = geo.city ? `${geo.city}, ${geo.country}` : geo.country;
    await db
      .update(schema.users)
      .set({ location, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  } catch {
    // best-effort uniquement
  }
}
