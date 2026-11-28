/** Règles pures des événements (visibilité, création, horaires, quotas). */

export const EVENT_VISIBILITIES = ['public', 'tribe', 'friends'] as const;
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];

export const RSVP_STATUSES = ['going', 'interested'] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const EVENT_LIMITS = {
  maxCreatedPerDay: 5,
  maxUpcomingPerUser: 10,
  maxDurationHours: 24 * 7,
  maxDaysAhead: 365,
  /** Sans heure de fin, un événement reste « en cours » ce nombre d'heures après son début. */
  defaultDurationHours: 3,
} as const;

export interface EventViewContext {
  visibility: string;
  isOrganizer: boolean;
  /** Le lecteur est compagnon de l'organisateur. */
  isCompanion: boolean;
  /** Le lecteur est membre de la tribu de l'événement. */
  isTribeMember: boolean;
  /** Blocage entre le lecteur et l'organisateur, dans un sens ou l'autre. */
  blocked: boolean;
}

/**
 * Qui peut voir un événement. L'organisateur voit toujours le sien ; un blocage masque l'événement aux deux
 * parties ; ensuite : public (tous), tribu (membres), amis (compagnons). Visibilité inconnue : refusé.
 */
export function canViewEvent(ctx: EventViewContext): boolean {
  if (ctx.isOrganizer) return true;
  if (ctx.blocked) return false;
  switch (ctx.visibility) {
    case 'public': return true;
    case 'tribe': return ctx.isTribeMember;
    case 'friends': return ctx.isCompanion;
    default: return false;
  }
}

export interface CreateEventContext {
  visibility: EventVisibility;
  /** Lieu culturel choisi, déjà vérifié comme PUBLIÉ par l'appelant ; null si non choisi. */
  placeIsPublished: boolean | null;
  hasFreePoint: boolean;
  tribeId: string | null;
  /** Rôle du créateur dans la tribu (null s'il n'en est pas membre). */
  tribeRole: string | null;
}

export type CreateEventRefusal =
  | 'PUBLIC_REQUIRES_PUBLISHED_PLACE'
  | 'LOCATION_REQUIRED'
  | 'TRIBE_REQUIRED'
  | 'TRIBE_MODERATOR_REQUIRED'
  | 'TRIBE_ONLY_WITH_TRIBE_VISIBILITY';

/**
 * Règles de création. Un événement PUBLIC n'a pour lieu qu'un lieu culturel déjà modéré : on ne peut donc pas
 * publier une adresse privée à tout le monde. Les événements « amis » et « tribu » peuvent utiliser un point
 * libre, car seule une audience de confiance les voit. Un événement de tribu exige d'en être modérateur.
 */
export function checkCreateEvent(ctx: CreateEventContext): CreateEventRefusal | null {
  if (ctx.tribeId && ctx.visibility !== 'tribe') return 'TRIBE_ONLY_WITH_TRIBE_VISIBILITY';
  if (ctx.visibility === 'tribe') {
    if (!ctx.tribeId) return 'TRIBE_REQUIRED';
    if (ctx.tribeRole !== 'owner' && ctx.tribeRole !== 'moderator') return 'TRIBE_MODERATOR_REQUIRED';
  }
  if (ctx.visibility === 'public') {
    if (ctx.placeIsPublished !== true) return 'PUBLIC_REQUIRES_PUBLISHED_PLACE';
    return null;
  }
  if (ctx.placeIsPublished === null && !ctx.hasFreePoint) return 'LOCATION_REQUIRED';
  if (ctx.placeIsPublished === false) return 'PUBLIC_REQUIRES_PUBLISHED_PLACE';
  return null;
}

export type ScheduleRefusal = 'START_IN_PAST' | 'END_BEFORE_START' | 'TOO_LONG' | 'TOO_FAR';

/** Validation des horaires. Une tolérance de 5 minutes évite de refuser un « maintenant » légèrement en retard. */
export function checkSchedule(startsAt: Date, endsAt: Date | null, now = Date.now()): ScheduleRefusal | null {
  const graceMs = 5 * 60 * 1000;
  if (startsAt.getTime() < now - graceMs) return 'START_IN_PAST';
  if (startsAt.getTime() > now + EVENT_LIMITS.maxDaysAhead * 24 * 3600 * 1000) return 'TOO_FAR';
  if (endsAt) {
    if (endsAt.getTime() <= startsAt.getTime()) return 'END_BEFORE_START';
    if (endsAt.getTime() - startsAt.getTime() > EVENT_LIMITS.maxDurationHours * 3600 * 1000) return 'TOO_LONG';
  }
  return null;
}

/** Instant de fin effectif (fin explicite, sinon début + durée par défaut). */
export function effectiveEnd(startsAt: Date, endsAt: Date | null): Date {
  return endsAt ?? new Date(startsAt.getTime() + EVENT_LIMITS.defaultDurationHours * 3600 * 1000);
}

/** Un événement est « à venir ou en cours » s'il n'est pas annulé et que sa fin effective n'est pas passée. */
export function isUpcoming(event: { status: string; startsAt: Date; endsAt: Date | null }, now = Date.now()): boolean {
  return event.status === 'active' && effectiveEnd(event.startsAt, event.endsAt).getTime() > now;
}

/** Réponse à un événement : seulement pour un événement à venir ; l'organisateur n'a pas besoin de répondre. */
export function checkRsvp(event: { status: string; startsAt: Date; endsAt: Date | null }, now = Date.now()): 'EVENT_CANCELLED' | 'EVENT_OVER' | null {
  if (event.status !== 'active') return 'EVENT_CANCELLED';
  if (!isUpcoming(event, now)) return 'EVENT_OVER';
  return null;
}
