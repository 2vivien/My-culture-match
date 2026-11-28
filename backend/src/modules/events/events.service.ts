import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { rateLimitHit } from '../../shared/utils/rate-limit';
import { recordAudit } from '../audit/audit.service';
import { boundingBox, blockedBetween, companionIds } from '../location/location.service';
import { distanceMeters } from '../places/places.policy';
import { autoHiddenPlaceIds } from '../places/places.service';
import {
  canViewEvent,
  checkCreateEvent,
  checkRsvp,
  checkSchedule,
  EVENT_LIMITS,
  effectiveEnd,
  isUpcoming,
  type CreateEventRefusal,
  type RsvpStatus,
  type ScheduleRefusal,
} from './events.policy';
import type { CreateEventInput } from './events.schemas';

type EventRow = typeof schema.events.$inferSelect;

export interface EventDto {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  visibility: string;
  status: string;
  latitude: number;
  longitude: number;
  locationLabel: string | null;
  placeId: string | null;
  tribeId: string | null;
  organizer: { id: string; name: string; avatar: string | null };
  going: number;
  interested: number;
  myRsvp: RsvpStatus | null;
  isOrganizer: boolean;
}

const REFUSAL_MESSAGES: Record<CreateEventRefusal | ScheduleRefusal, string> = {
  PUBLIC_REQUIRES_PUBLISHED_PLACE: 'Un événement public doit avoir lieu dans un lieu culturel publié',
  LOCATION_REQUIRED: 'Choisis un lieu ou un point pour cet événement',
  TRIBE_REQUIRED: 'Un événement de tribu nécessite une tribu',
  TRIBE_MODERATOR_REQUIRED: 'Seul un modérateur de la tribu peut y créer un événement',
  TRIBE_ONLY_WITH_TRIBE_VISIBILITY: 'Une tribu n’est possible que pour la visibilité « tribu »',
  START_IN_PAST: 'Le début de l’événement est déjà passé',
  END_BEFORE_START: 'La fin doit être après le début',
  TOO_LONG: `Un événement dure ${EVENT_LIMITS.maxDurationHours / 24} jours au maximum`,
  TOO_FAR: `Un événement doit commencer dans l'année`,
};

async function hydrate(rows: EventRow[], viewerId: string): Promise<EventDto[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const organizerIds = [...new Set(rows.map((r) => r.organizerId))];
  const [organizers, counts, mine] = await Promise.all([
    db.select({ id: schema.users.id, name: schema.users.name, avatar: schema.users.avatar }).from(schema.users).where(inArray(schema.users.id, organizerIds)),
    db.select({ eventId: schema.eventRsvps.eventId, status: schema.eventRsvps.status, n: sql<number>`count(*)::int` }).from(schema.eventRsvps)
      .where(inArray(schema.eventRsvps.eventId, ids)).groupBy(schema.eventRsvps.eventId, schema.eventRsvps.status),
    db.select({ eventId: schema.eventRsvps.eventId, status: schema.eventRsvps.status }).from(schema.eventRsvps)
      .where(and(inArray(schema.eventRsvps.eventId, ids), eq(schema.eventRsvps.userId, viewerId))),
  ]);
  const orgBy = new Map(organizers.map((o) => [o.id, o]));
  const mineBy = new Map(mine.map((m) => [m.eventId, m.status as RsvpStatus]));
  const countOf = (eventId: string, status: string) => counts.find((c) => c.eventId === eventId && c.status === status)?.n ?? 0;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt ? r.endsAt.toISOString() : null,
    visibility: r.visibility,
    status: r.status,
    latitude: r.latitude,
    longitude: r.longitude,
    locationLabel: r.locationLabel,
    placeId: r.placeId,
    tribeId: r.tribeId,
    organizer: orgBy.get(r.organizerId) ?? { id: r.organizerId, name: '', avatar: null },
    going: countOf(r.id, 'going'),
    interested: countOf(r.id, 'interested'),
    myRsvp: mineBy.get(r.id) ?? null,
    isOrganizer: r.organizerId === viewerId,
  }));
}

/**
 * Événements PUBLICS dont le lieu culturel n'est plus publié (retiré ou refusé par la modération) : ils ne
 * doivent plus apparaître, sinon un lieu retiré pour adresse privée resterait exposé par ses événements.
 */
async function hiddenByPlaceTakedown(rows: EventRow[]): Promise<Set<string>> {
  const withPlace = rows.filter((r) => r.visibility === 'public' && r.placeId);
  if (withPlace.length === 0) return new Set();
  const placeIds = [...new Set(withPlace.map((r) => r.placeId as string))];
  const published = await db.select({ id: schema.culturalPlaces.id }).from(schema.culturalPlaces)
    .where(and(inArray(schema.culturalPlaces.id, placeIds), eq(schema.culturalPlaces.status, 'published')));
  const flagged = await autoHiddenPlaceIds(published.map((p) => p.id));
  const ok = new Set(published.map((p) => p.id).filter((id) => !flagged.has(id)));
  return new Set(withPlace.filter((r) => !ok.has(r.placeId as string)).map((r) => r.id));
}

/** Contexte de visibilité du lecteur : compagnons, blocages, tribus. Calculé une fois pour toute une liste. */
async function viewerContext(viewerId: string, rows: EventRow[]) {
  const tribeIds = [...new Set(rows.map((r) => r.tribeId).filter((t): t is string => Boolean(t)))];
  const [friends, blocked, memberships] = await Promise.all([
    companionIds(viewerId),
    blockedBetween(viewerId),
    tribeIds.length > 0
      ? db.select({ tribeId: schema.tribeMembers.tribeId }).from(schema.tribeMembers).where(and(eq(schema.tribeMembers.userId, viewerId), inArray(schema.tribeMembers.tribeId, tribeIds)))
      : Promise.resolve([] as Array<{ tribeId: string }>),
  ]);
  const myTribes = new Set(memberships.map((m) => m.tribeId));
  return (e: EventRow) =>
    canViewEvent({
      visibility: e.visibility,
      isOrganizer: e.organizerId === viewerId,
      isCompanion: friends.has(e.organizerId),
      isTribeMember: Boolean(e.tribeId && myTribes.has(e.tribeId)),
      blocked: blocked.has(e.organizerId),
    });
}

/** POST /api/events. */
export async function createEvent(userId: string, input: CreateEventInput): Promise<EventDto> {
  const startsAt = new Date(input.startsAt);
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  const scheduleRefusal = checkSchedule(startsAt, endsAt);
  if (scheduleRefusal) throw AppError.badRequest(REFUSAL_MESSAGES[scheduleRefusal], `EVENT_${scheduleRefusal}`);

  const rl = await rateLimitHit(`events:create:${userId}`, EVENT_LIMITS.maxCreatedPerDay, 24 * 60 * 60);
  if (!rl.allowed) throw AppError.tooMany('Trop d’événements créés aujourd’hui, réessaie demain', 'EVENT_RATE_LIMITED');

  const [upcoming] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.events)
    .where(and(eq(schema.events.organizerId, userId), eq(schema.events.status, 'active'), gte(schema.events.startsAt, new Date())));
  if ((upcoming?.n ?? 0) >= EVENT_LIMITS.maxUpcomingPerUser) {
    throw AppError.badRequest(`Tu as déjà ${EVENT_LIMITS.maxUpcomingPerUser} événements à venir`, 'EVENT_UPCOMING_LIMIT');
  }

  let place: typeof schema.culturalPlaces.$inferSelect | undefined;
  if (input.placeId) {
    [place] = await db.select().from(schema.culturalPlaces).where(eq(schema.culturalPlaces.id, input.placeId)).limit(1);
    if (!place) throw AppError.notFound('Lieu introuvable', 'PLACE_NOT_FOUND');
  }

  let tribeRole: string | null = null;
  if (input.tribeId) {
    const [m] = await db.select({ role: schema.tribeMembers.role }).from(schema.tribeMembers)
      .where(and(eq(schema.tribeMembers.tribeId, input.tribeId), eq(schema.tribeMembers.userId, userId))).limit(1);
    tribeRole = m?.role ?? null;
  }

  const refusal = checkCreateEvent({
    visibility: input.visibility,
    placeIsPublished: place ? place.status === 'published' : null,
    hasFreePoint: Boolean(input.point),
    tribeId: input.tribeId ?? null,
    tribeRole,
  });
  if (refusal) throw AppError.forbidden(REFUSAL_MESSAGES[refusal], `EVENT_${refusal}`);

  // Un lieu publié fait foi pour la position ; sinon le point libre (déjà exigé par checkCreateEvent).
  const latitude = place ? place.latitude : (input.point as { latitude: number }).latitude;
  const longitude = place ? place.longitude : (input.point as { longitude: number }).longitude;
  const locationLabel = place ? place.name : (input.point?.label ?? null);

  const [row] = await db.insert(schema.events).values({
    title: input.title,
    description: input.description ?? null,
    startsAt,
    endsAt,
    visibility: input.visibility,
    organizerId: userId,
    tribeId: input.tribeId ?? null,
    placeId: place?.id ?? null,
    locationLabel,
    latitude,
    longitude,
  }).returning();
  if (!row) throw AppError.badRequest('Échec de création de l’événement', 'EVENT_CREATE_FAILED');
  await recordAudit(userId, 'event.created', { eventId: row.id, visibility: row.visibility });
  return (await hydrate([row], userId))[0] as EventDto;
}

/** GET /api/events — événements à venir autour d'un point, visibles par ce lecteur. */
export async function listEvents(viewerId: string, params: { lat: number; lon: number; radiusKm: number; days: number }): Promise<{ events: EventDto[] }> {
  const { minLat, maxLat, minLon, maxLon } = boundingBox(params.lat, params.lon, params.radiusKm);
  const now = new Date();
  const horizon = new Date(now.getTime() + params.days * 24 * 3600 * 1000);
  const rows = await db.select().from(schema.events).where(and(
    eq(schema.events.status, 'active'),
    // Début au plus tard à l'horizon ; fin non passée vérifiée ensuite (la fin peut être implicite).
    lte(schema.events.startsAt, horizon),
    gte(schema.events.startsAt, new Date(now.getTime() - 24 * 3600 * 1000)),
    gte(schema.events.latitude, minLat), lte(schema.events.latitude, maxLat),
    gte(schema.events.longitude, minLon), lte(schema.events.longitude, maxLon),
  )).orderBy(schema.events.startsAt).limit(500);

  const here = { latitude: params.lat, longitude: params.lon };
  const upcoming = rows.filter((e) => isUpcoming(e) && distanceMeters(here, e) <= params.radiusKm * 1000);
  const [canView, hidden] = await Promise.all([viewerContext(viewerId, upcoming), hiddenByPlaceTakedown(upcoming)]);
  const visible = upcoming.filter((e) => canView(e) && !hidden.has(e.id)).slice(0, 100);
  return { events: await hydrate(visible, viewerId) };
}

async function loadVisible(viewerId: string, eventId: string): Promise<EventRow> {
  const [row] = await db.select().from(schema.events).where(eq(schema.events.id, eventId)).limit(1);
  // 404 aussi pour un événement non visible : on ne confirme pas son existence.
  if (!row || !(await viewerContext(viewerId, [row]))(row) || (await hiddenByPlaceTakedown([row])).has(row.id)) throw AppError.notFound('Événement introuvable', 'EVENT_NOT_FOUND');
  return row;
}

/** GET /api/events/:id. */
export async function getEvent(viewerId: string, eventId: string): Promise<EventDto> {
  return (await hydrate([await loadVisible(viewerId, eventId)], viewerId))[0] as EventDto;
}

/** POST /api/events/:id/rsvp — « going » / « interested », ou null pour retirer sa réponse. */
export async function setRsvp(userId: string, eventId: string, status: RsvpStatus | null): Promise<EventDto> {
  const event = await loadVisible(userId, eventId);
  if (status === null) {
    await db.delete(schema.eventRsvps).where(and(eq(schema.eventRsvps.eventId, eventId), eq(schema.eventRsvps.userId, userId)));
  } else {
    const refusal = checkRsvp(event);
    if (refusal) throw AppError.badRequest(refusal === 'EVENT_CANCELLED' ? 'Cet événement est annulé' : 'Cet événement est terminé', refusal);
    await db.insert(schema.eventRsvps).values({ eventId, userId, status })
      .onConflictDoUpdate({ target: [schema.eventRsvps.eventId, schema.eventRsvps.userId], set: { status } });
  }
  return (await hydrate([event], userId))[0] as EventDto;
}

/** DELETE /api/events/:id — l'organisateur annule (l'événement reste lisible, marqué annulé). */
export async function cancelEvent(userId: string, eventId: string): Promise<{ cancelled: boolean }> {
  const [row] = await db.update(schema.events).set({ status: 'cancelled' })
    .where(and(eq(schema.events.id, eventId), eq(schema.events.organizerId, userId), eq(schema.events.status, 'active')))
    .returning({ id: schema.events.id });
  if (!row) throw AppError.notFound('Événement introuvable', 'EVENT_NOT_FOUND');
  await recordAudit(userId, 'event.cancelled', { eventId });
  return { cancelled: true };
}

/** Fin effective, exposée pour les clients qui affichent « en cours ». */
export { effectiveEnd };
