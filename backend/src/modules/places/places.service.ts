import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { rateLimitHit } from '../../shared/utils/rate-limit';
import { recordAudit } from '../audit/audit.service';
import { boundingBox } from '../location/location.service';
import { distanceMeters, isDuplicatePlace, isValidRejectionReason, nextPlaceStatus, PLACE_LIMITS, shouldAutoHidePlace, type PlaceStatus } from './places.policy';
import type { ProposePlaceInput } from './places.schemas';

export interface PublicPlaceDto {
  id: string;
  name: string;
  category: string;
  description: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface MyPlaceDto extends PublicPlaceDto {
  status: PlaceStatus;
  rejectionReason: string | null;
  createdAt: string;
}

type PlaceRow = typeof schema.culturalPlaces.$inferSelect;

const toPublic = (r: PlaceRow): PublicPlaceDto => ({
  id: r.id, name: r.name, category: r.category, description: r.description, country: r.country, latitude: r.latitude, longitude: r.longitude,
});

/** Lieux masqués automatiquement : assez de signalements ouverts de personnes distinctes (voir PLACE_AUTO_HIDE_REPORTS). */
export async function autoHiddenPlaceIds(placeIds: string[]): Promise<Set<string>> {
  if (placeIds.length === 0) return new Set();
  const rows = await db
    .select({ targetId: schema.reports.targetId, n: sql<number>`count(distinct ${schema.reports.reporterId})::int` })
    .from(schema.reports)
    .where(and(eq(schema.reports.targetType, 'place'), eq(schema.reports.status, 'open'), inArray(schema.reports.targetId, placeIds)))
    .groupBy(schema.reports.targetId);
  return new Set(rows.filter((r) => shouldAutoHidePlace(r.n)).map((r) => r.targetId));
}

/** POST /api/places — proposition. Toujours « en attente » : seule une modération publie. */
export async function proposePlace(userId: string, input: ProposePlaceInput): Promise<MyPlaceDto> {
  const rl = await rateLimitHit(`places:propose:${userId}`, PLACE_LIMITS.maxProposalsPerDay, 24 * 60 * 60);
  if (!rl.allowed) throw AppError.tooMany('Trop de propositions aujourd’hui, réessaie demain', 'PLACE_RATE_LIMITED');

  const [pending] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.culturalPlaces)
    .where(and(eq(schema.culturalPlaces.createdById, userId), eq(schema.culturalPlaces.status, 'pending')));
  if ((pending?.n ?? 0) >= PLACE_LIMITS.maxPendingPerUser) {
    throw AppError.badRequest(`Tu as déjà ${PLACE_LIMITS.maxPendingPerUser} propositions en attente de modération`, 'PLACE_PENDING_LIMIT');
  }

  // Doublon : lieux publiés ou en attente, de même nom, autour du point proposé (~300 m de côté pour la requête).
  const delta = 0.003;
  const nearby = await db.select({ name: schema.culturalPlaces.name, latitude: schema.culturalPlaces.latitude, longitude: schema.culturalPlaces.longitude })
    .from(schema.culturalPlaces)
    .where(and(
      sql`${schema.culturalPlaces.status} IN ('pending', 'published')`,
      gte(schema.culturalPlaces.latitude, input.latitude - delta), lte(schema.culturalPlaces.latitude, input.latitude + delta),
      gte(schema.culturalPlaces.longitude, input.longitude - delta), lte(schema.culturalPlaces.longitude, input.longitude + delta),
    ))
    .limit(200);
  if (isDuplicatePlace({ name: input.name, latitude: input.latitude, longitude: input.longitude }, nearby)) {
    throw AppError.conflict('Ce lieu existe déjà à proximité', 'PLACE_DUPLICATE');
  }

  const [row] = await db.insert(schema.culturalPlaces).values({
    name: input.name,
    category: input.category,
    description: input.description ?? null,
    country: input.country ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    status: 'pending',
    createdById: userId,
  }).returning();
  if (!row) throw AppError.badRequest('Échec de la proposition', 'PLACE_CREATE_FAILED');
  await recordAudit(userId, 'place.proposed', { placeId: row.id });
  return { ...toPublic(row), status: 'pending', rejectionReason: null, createdAt: row.createdAt.toISOString() };
}

/** GET /api/places — lieux PUBLIÉS autour d'un point. Ne divulgue jamais l'auteur de la proposition. */
export async function listPlaces(params: { lat: number; lon: number; radiusKm: number; category?: string }): Promise<{ places: PublicPlaceDto[] }> {
  const { minLat, maxLat, minLon, maxLon } = boundingBox(params.lat, params.lon, params.radiusKm);
  const rows = await db.select().from(schema.culturalPlaces).where(and(
    eq(schema.culturalPlaces.status, 'published'),
    params.category ? eq(schema.culturalPlaces.category, params.category) : undefined,
    gte(schema.culturalPlaces.latitude, minLat), lte(schema.culturalPlaces.latitude, maxLat),
    gte(schema.culturalPlaces.longitude, minLon), lte(schema.culturalPlaces.longitude, maxLon),
  )).limit(500);
  const hidden = await autoHiddenPlaceIds(rows.map((r) => r.id));
  const places = rows
    .filter((r) => !hidden.has(r.id))
    .filter((r) => distanceMeters({ latitude: params.lat, longitude: params.lon }, r) <= params.radiusKm * 1000)
    .sort((a, b) => distanceMeters({ latitude: params.lat, longitude: params.lon }, a) - distanceMeters({ latitude: params.lat, longitude: params.lon }, b))
    .slice(0, 200)
    .map(toPublic);
  return { places };
}

/** GET /api/places/mine — mes propositions, avec leur statut et la raison d'un refus. */
export async function listMyPlaces(userId: string): Promise<{ places: MyPlaceDto[] }> {
  const rows = await db.select().from(schema.culturalPlaces).where(eq(schema.culturalPlaces.createdById, userId)).orderBy(desc(schema.culturalPlaces.createdAt)).limit(100);
  return { places: rows.map((r) => ({ ...toPublic(r), status: r.status as PlaceStatus, rejectionReason: r.rejectionReason, createdAt: r.createdAt.toISOString() })) };
}

/** DELETE /api/places/:id — l'auteur retire sa proposition (en attente, refusée ou publiée). */
export async function deleteMyPlace(userId: string, placeId: string): Promise<{ deleted: boolean }> {
  const removed = await db.delete(schema.culturalPlaces)
    .where(and(eq(schema.culturalPlaces.id, placeId), eq(schema.culturalPlaces.createdById, userId)))
    .returning({ id: schema.culturalPlaces.id });
  if (removed.length === 0) throw AppError.notFound('Lieu introuvable', 'PLACE_NOT_FOUND');
  return { deleted: true };
}

// ── Administration (requireAdmin appliqué par les routes) ────────────────────

export interface AdminPlaceDto extends PublicPlaceDto {
  status: PlaceStatus;
  rejectionReason: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
}

/** GET /api/admin/places?status= — file de modération. */
export async function adminListPlaces(status: PlaceStatus, limit: number): Promise<{ places: AdminPlaceDto[] }> {
  const rows = await db
    .select({ place: schema.culturalPlaces, authorName: schema.users.name })
    .from(schema.culturalPlaces)
    .innerJoin(schema.users, eq(schema.users.id, schema.culturalPlaces.createdById))
    .where(eq(schema.culturalPlaces.status, status))
    .orderBy(schema.culturalPlaces.createdAt)
    .limit(limit);
  return {
    places: rows.map((r) => ({
      ...toPublic(r.place),
      status: r.place.status as PlaceStatus,
      rejectionReason: r.place.rejectionReason,
      createdAt: r.place.createdAt.toISOString(),
      createdBy: { id: r.place.createdById, name: r.authorName },
    })),
  };
}

/** POST /api/admin/places/:id/approve | reject. Un refus exige une raison ; chaque décision est journalisée. */
export async function moderatePlace(adminId: string, placeId: string, action: 'approve' | 'reject', reason?: string): Promise<{ id: string; status: PlaceStatus }> {
  const [place] = await db.select().from(schema.culturalPlaces).where(eq(schema.culturalPlaces.id, placeId)).limit(1);
  if (!place) throw AppError.notFound('Lieu introuvable', 'PLACE_NOT_FOUND');
  if (action === 'reject' && !isValidRejectionReason(reason)) {
    throw AppError.badRequest('Un refus doit être motivé (3 à 300 caractères)', 'PLACE_REJECTION_REASON_REQUIRED');
  }
  const next = nextPlaceStatus(place.status as PlaceStatus, action);
  if (!next) throw AppError.conflict('Ce lieu a déjà cet état', 'PLACE_ALREADY_IN_STATE');

  await db.update(schema.culturalPlaces).set({
    status: next,
    rejectionReason: action === 'reject' ? (reason ?? '').trim() : null,
    reviewedById: adminId,
    reviewedAt: new Date(),
  }).where(eq(schema.culturalPlaces.id, placeId));
  await recordAudit(adminId, action === 'approve' ? 'place.approved' : 'place.rejected', { placeId, from: place.status });
  if (action === 'reject') {
    // Le lieu est retiré : les signalements ouverts à son sujet sont traités (la raison est celle du retrait).
    await db.update(schema.reports)
      .set({ status: 'actioned', moderatorId: adminId, resolution: `Lieu retiré : ${(reason ?? '').trim()}`, resolvedAt: new Date() })
      .where(and(eq(schema.reports.targetType, 'place'), eq(schema.reports.targetId, placeId), eq(schema.reports.status, 'open')));
  }
  return { id: placeId, status: next };
}
