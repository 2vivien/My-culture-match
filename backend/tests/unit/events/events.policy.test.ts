import { describe, expect, it } from 'vitest';
import {
  canViewEvent,
  checkCreateEvent,
  checkRsvp,
  checkSchedule,
  effectiveEnd,
  EVENT_LIMITS,
  isUpcoming,
  type CreateEventContext,
  type EventViewContext,
} from '../../../src/modules/events/events.policy';

const view = (over: Partial<EventViewContext> = {}): EventViewContext => ({ visibility: 'public', isOrganizer: false, isCompanion: false, isTribeMember: false, blocked: false, ...over });

describe('canViewEvent', () => {
  it('un événement public est visible de tous', () => {
    expect(canViewEvent(view())).toBe(true);
  });

  it('« amis » : seulement les compagnons de l’organisateur', () => {
    expect(canViewEvent(view({ visibility: 'friends', isCompanion: true }))).toBe(true);
    expect(canViewEvent(view({ visibility: 'friends' }))).toBe(false);
  });

  it('« tribu » : seulement les membres de la tribu', () => {
    expect(canViewEvent(view({ visibility: 'tribe', isTribeMember: true }))).toBe(true);
    expect(canViewEvent(view({ visibility: 'tribe', isCompanion: true }))).toBe(false);
  });

  it('un blocage masque l’événement, même public ou entre compagnons', () => {
    expect(canViewEvent(view({ blocked: true }))).toBe(false);
    expect(canViewEvent(view({ visibility: 'friends', isCompanion: true, blocked: true }))).toBe(false);
  });

  it('l’organisateur voit toujours son événement', () => {
    expect(canViewEvent(view({ visibility: 'friends', isOrganizer: true }))).toBe(true);
  });

  it('une visibilité inconnue est refusée', () => {
    expect(canViewEvent(view({ visibility: 'secret', isOrganizer: false }))).toBe(false);
  });
});

const create = (over: Partial<CreateEventContext> = {}): CreateEventContext => ({ visibility: 'friends', placeIsPublished: null, hasFreePoint: true, tribeId: null, tribeRole: null, ...over });

describe('checkCreateEvent', () => {
  it('« amis » avec un point libre est accepté', () => {
    expect(checkCreateEvent(create())).toBeNull();
  });

  it('un événement public exige un lieu culturel publié (jamais un point libre)', () => {
    expect(checkCreateEvent(create({ visibility: 'public', hasFreePoint: true }))).toBe('PUBLIC_REQUIRES_PUBLISHED_PLACE');
    expect(checkCreateEvent(create({ visibility: 'public', placeIsPublished: false }))).toBe('PUBLIC_REQUIRES_PUBLISHED_PLACE');
    expect(checkCreateEvent(create({ visibility: 'public', placeIsPublished: true }))).toBeNull();
  });

  it('un lieu non publié ne peut servir à aucun événement', () => {
    expect(checkCreateEvent(create({ placeIsPublished: false }))).toBe('PUBLIC_REQUIRES_PUBLISHED_PLACE');
  });

  it('sans lieu ni point, la localisation est requise', () => {
    expect(checkCreateEvent(create({ hasFreePoint: false }))).toBe('LOCATION_REQUIRED');
  });

  it('un événement de tribu exige une tribu et un rôle de modérateur ou propriétaire', () => {
    expect(checkCreateEvent(create({ visibility: 'tribe' }))).toBe('TRIBE_REQUIRED');
    expect(checkCreateEvent(create({ visibility: 'tribe', tribeId: 't', tribeRole: 'member' }))).toBe('TRIBE_MODERATOR_REQUIRED');
    expect(checkCreateEvent(create({ visibility: 'tribe', tribeId: 't', tribeRole: null }))).toBe('TRIBE_MODERATOR_REQUIRED');
    expect(checkCreateEvent(create({ visibility: 'tribe', tribeId: 't', tribeRole: 'moderator' }))).toBeNull();
    expect(checkCreateEvent(create({ visibility: 'tribe', tribeId: 't', tribeRole: 'owner' }))).toBeNull();
  });

  it('une tribu n’a de sens que pour la visibilité « tribu »', () => {
    expect(checkCreateEvent(create({ visibility: 'public', placeIsPublished: true, tribeId: 't', tribeRole: 'owner' }))).toBe('TRIBE_ONLY_WITH_TRIBE_VISIBILITY');
  });
});

describe('checkSchedule', () => {
  const now = Date.UTC(2026, 10, 27, 12);
  const at = (hours: number) => new Date(now + hours * 3600_000);

  it('accepte un événement futur avec ou sans fin', () => {
    expect(checkSchedule(at(24), at(27), now)).toBeNull();
    expect(checkSchedule(at(1), null, now)).toBeNull();
  });

  it('refuse un début passé, avec 5 minutes de tolérance', () => {
    expect(checkSchedule(at(-1), null, now)).toBe('START_IN_PAST');
    expect(checkSchedule(new Date(now - 4 * 60_000), null, now)).toBeNull();
    expect(checkSchedule(new Date(now - 6 * 60_000), null, now)).toBe('START_IN_PAST');
  });

  it('refuse une fin avant ou égale au début, et une durée excessive', () => {
    expect(checkSchedule(at(2), at(2), now)).toBe('END_BEFORE_START');
    expect(checkSchedule(at(2), at(1), now)).toBe('END_BEFORE_START');
    expect(checkSchedule(at(2), at(2 + EVENT_LIMITS.maxDurationHours + 1), now)).toBe('TOO_LONG');
    expect(checkSchedule(at(2), at(2 + EVENT_LIMITS.maxDurationHours), now)).toBeNull();
  });

  it('refuse un début à plus d’un an', () => {
    expect(checkSchedule(at(24 * 366), null, now)).toBe('TOO_FAR');
  });
});

describe('isUpcoming / checkRsvp', () => {
  const now = Date.UTC(2026, 10, 27, 12);
  const start = new Date(now + 3600_000);

  it('sans heure de fin, l’événement dure 3 h par défaut', () => {
    expect(effectiveEnd(start, null).getTime()).toBe(start.getTime() + 3 * 3600_000);
    expect(isUpcoming({ status: 'active', startsAt: new Date(now - 2 * 3600_000), endsAt: null }, now)).toBe(true);
    expect(isUpcoming({ status: 'active', startsAt: new Date(now - 4 * 3600_000), endsAt: null }, now)).toBe(false);
  });

  it('un événement annulé n’est jamais à venir', () => {
    expect(isUpcoming({ status: 'cancelled', startsAt: start, endsAt: null }, now)).toBe(false);
  });

  it('on ne répond pas à un événement annulé ou terminé', () => {
    expect(checkRsvp({ status: 'cancelled', startsAt: start, endsAt: null }, now)).toBe('EVENT_CANCELLED');
    expect(checkRsvp({ status: 'active', startsAt: new Date(now - 10 * 3600_000), endsAt: null }, now)).toBe('EVENT_OVER');
    expect(checkRsvp({ status: 'active', startsAt: start, endsAt: null }, now)).toBeNull();
  });
});
