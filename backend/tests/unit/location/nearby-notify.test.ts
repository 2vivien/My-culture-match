import { describe, expect, it } from 'vitest';
import {
  decideNearbyNotification,
  reserveNearbyNotification,
  nearbyDailyKey,
  nearbyPairKey,
  NEARBY_DAILY_CAP,
  NEARBY_NOTIFY_RADIUS_KM,
  NEARBY_PAIR_TTL_SECONDS,
  NEARBY_RECIPIENT_FRESH_MS,
  type NearbyNotifyInput,
  type NearbyQuotaStore,
} from '../../../src/modules/location/location.nearby-notify';

const NOW = Date.parse('2026-06-01T12:00:00Z');

/** Cas nominal : un compagnon visible, à 2 km, destinataire opt-in avec position fraîche. */
const ok = (over: Partial<{ [K in keyof NearbyNotifyInput]: Partial<NearbyNotifyInput[K]> | NearbyNotifyInput[K] }> = {}): NearbyNotifyInput => ({
  emitterId: 'emitter',
  recipientId: 'recipient',
  emitter: { sharingEnabled: true, ghostMode: false, expiresAt: null, visibility: 'friends', mode: 'default', ...(over.emitter as object) },
  relation: { blocked: false, isFriend: true, isFriendOfFriend: false, listed: false, ...(over.relation as object) },
  recipient: { optIn: true, sharingEnabled: true, locationUpdatedAt: new Date(NOW - 60_000), ...(over.recipient as object) },
  distanceKm: 2,
  pairAlreadyNotified: false,
  recipientDailyCount: 0,
  ...(Object.fromEntries(Object.entries(over).filter(([k]) => !['emitter', 'relation', 'recipient'].includes(k))) as object),
});

const decide = (input: NearbyNotifyInput) => decideNearbyNotification(input, NOW);

describe('decideNearbyNotification — cas nominal', () => {
  it('notifie quand tout est réuni', () => {
    expect(decide(ok())).toEqual({ notify: true });
  });
});

describe('opt-in du destinataire', () => {
  it('refuse sans opt-in, même si tout le reste est parfait', () => {
    expect(decide(ok({ recipient: { optIn: false } }))).toEqual({ notify: false, reason: 'recipient_not_opted_in' });
  });
  it('refuse si le destinataire ne partage pas sa position', () => {
    expect(decide(ok({ recipient: { sharingEnabled: false } }))).toEqual({ notify: false, reason: 'recipient_location_unavailable' });
  });
  it('refuse si la position du destinataire est inconnue ou périmée', () => {
    expect(decide(ok({ recipient: { locationUpdatedAt: null } }))).toMatchObject({ notify: false, reason: 'recipient_location_unavailable' });
    expect(decide(ok({ recipient: { locationUpdatedAt: new Date(NOW - NEARBY_RECIPIENT_FRESH_MS - 1) } }))).toMatchObject({ reason: 'recipient_location_unavailable' });
    expect(decide(ok({ recipient: { locationUpdatedAt: new Date(NOW - NEARBY_RECIPIENT_FRESH_MS) } }))).toEqual({ notify: true });
  });
});

describe('l’émetteur n’émet rien s’il est caché', () => {
  it('mode fantôme', () => {
    expect(decide(ok({ emitter: { ghostMode: true } }))).toEqual({ notify: false, reason: 'emitter_hidden' });
  });
  it('partage désactivé', () => {
    expect(decide(ok({ emitter: { sharingEnabled: false } }))).toEqual({ notify: false, reason: 'emitter_hidden' });
  });
  it('partage expiré (et pas encore expiré -> ok)', () => {
    expect(decide(ok({ emitter: { expiresAt: new Date(NOW - 1) } }))).toEqual({ notify: false, reason: 'emitter_hidden' });
    expect(decide(ok({ emitter: { expiresAt: new Date(NOW) } }))).toEqual({ notify: false, reason: 'emitter_hidden' });
    expect(decide(ok({ emitter: { expiresAt: new Date(NOW + 60_000) } }))).toEqual({ notify: true });
  });
});

describe('blocages', () => {
  it('un blocage (dans un sens ou l’autre) coupe tout, même pour un compagnon visible', () => {
    expect(decide(ok({ relation: { blocked: true } }))).toEqual({ notify: false, reason: 'blocked' });
  });
  it('le blocage prime sur tous les autres motifs', () => {
    expect(decide(ok({ relation: { blocked: true }, recipient: { optIn: false } }))).toMatchObject({ reason: 'blocked' });
  });
});

describe('mêmes règles de visibilité que canSeeLocation', () => {
  it('visibilité « nobody » : jamais, quelle que soit l’audience', () => {
    for (const mode of ['default', 'selected', 'except'] as const) {
      expect(decide(ok({ emitter: { visibility: 'nobody', mode }, relation: { listed: true } }))).toEqual({ notify: false, reason: 'not_visible' });
    }
  });
  it('« friends » : refuse un inconnu et un ami d’ami, accepte un compagnon', () => {
    expect(decide(ok({ relation: { isFriend: false, isFriendOfFriend: false } }))).toMatchObject({ reason: 'not_visible' });
    expect(decide(ok({ relation: { isFriend: false, isFriendOfFriend: true } }))).toMatchObject({ reason: 'not_visible' });
    expect(decide(ok())).toEqual({ notify: true });
  });
  it('« friends_of_friends » accepte un ami d’ami', () => {
    expect(decide(ok({ emitter: { visibility: 'friends_of_friends' }, relation: { isFriend: false, isFriendOfFriend: true } }))).toEqual({ notify: true });
  });
  it('« nearby » et « everyone » acceptent un inconnu', () => {
    for (const visibility of ['nearby', 'everyone'] as const) {
      expect(decide(ok({ emitter: { visibility }, relation: { isFriend: false, isFriendOfFriend: false } }))).toEqual({ notify: true });
    }
  });
  it('audience « selected » : seulement les compagnons listés', () => {
    expect(decide(ok({ emitter: { mode: 'selected' }, relation: { listed: true } }))).toEqual({ notify: true });
    expect(decide(ok({ emitter: { mode: 'selected' }, relation: { listed: false } }))).toMatchObject({ reason: 'not_visible' });
    // listé mais plus compagnon : accès périmé
    expect(decide(ok({ emitter: { mode: 'selected', visibility: 'everyone' }, relation: { listed: true, isFriend: false } }))).toMatchObject({ reason: 'not_visible' });
  });
  it('audience « except » : exclut les personnes listées', () => {
    expect(decide(ok({ emitter: { mode: 'except' }, relation: { listed: true } }))).toMatchObject({ reason: 'not_visible' });
    expect(decide(ok({ emitter: { mode: 'except' }, relation: { listed: false } }))).toEqual({ notify: true });
  });
});

describe('proximité', () => {
  it('refuse au-delà du rayon, accepte pile au rayon', () => {
    expect(decide(ok({ distanceKm: NEARBY_NOTIFY_RADIUS_KM }))).toEqual({ notify: true });
    expect(decide(ok({ distanceKm: NEARBY_NOTIFY_RADIUS_KM + 0.01 }))).toEqual({ notify: false, reason: 'too_far' });
  });
  it('refuse si la distance est inconnue ou non finie', () => {
    expect(decide(ok({ distanceKm: null }))).toMatchObject({ reason: 'too_far' });
    expect(decide(ok({ distanceKm: Number.NaN }))).toMatchObject({ reason: 'too_far' });
    expect(decide(ok({ distanceKm: Number.POSITIVE_INFINITY }))).toMatchObject({ reason: 'too_far' });
  });
});

describe('plafonds', () => {
  it('une seule notification par paire sur la fenêtre', () => {
    expect(decide(ok({ pairAlreadyNotified: true }))).toEqual({ notify: false, reason: 'pair_cap' });
  });
  it(`au plus ${NEARBY_DAILY_CAP} par destinataire et par jour`, () => {
    expect(decide(ok({ recipientDailyCount: NEARBY_DAILY_CAP - 1 }))).toEqual({ notify: true });
    expect(decide(ok({ recipientDailyCount: NEARBY_DAILY_CAP }))).toEqual({ notify: false, reason: 'daily_cap' });
    expect(decide(ok({ recipientDailyCount: NEARBY_DAILY_CAP + 5 }))).toMatchObject({ reason: 'daily_cap' });
  });
});

describe('divers', () => {
  it('ne se notifie jamais soi-même', () => {
    expect(decide(ok({ recipientId: 'emitter' } as never))).toEqual({ notify: false, reason: 'self' });
  });
  it('la décision ne contient ni distance ni position', () => {
    const d = decide(ok());
    expect(Object.keys(d)).toEqual(['notify']);
  });
});

/** Faux store Redis en mémoire (TTL ignoré mais enregistré). */
function fakeStore() {
  const data = new Map<string, number | string>();
  const ttl = new Map<string, number>();
  const store: NearbyQuotaStore = {
    async set(key, value, _mode, seconds, _flag) {
      if (data.has(key)) return null;
      data.set(key, value);
      ttl.set(key, seconds);
      return 'OK';
    },
    async incr(key) { const v = Number(data.get(key) ?? 0) + 1; data.set(key, v); return v; },
    async decr(key) { const v = Number(data.get(key) ?? 0) - 1; data.set(key, v); return v; },
    async expire(key, seconds) { ttl.set(key, seconds); return 1; },
    async del(key) { return data.delete(key) ? 1 : 0; },
  };
  return { store, data, ttl };
}

describe('reserveNearbyNotification — plafonds atomiques', () => {
  it('première réservation acceptée, TTL posés (24 h)', async () => {
    const { store, ttl, data } = fakeStore();
    expect(await reserveNearbyNotification(store, 'a', 'r')).toEqual({ ok: true });
    expect(ttl.get(nearbyPairKey('a', 'r'))).toBe(NEARBY_PAIR_TTL_SECONDS);
    expect(ttl.get(nearbyDailyKey('r'))).toBe(86400);
    expect(data.get(nearbyDailyKey('r'))).toBe(1);
  });

  it('la même paire est refusée une 2e fois sans consommer le quota journalier', async () => {
    const { store, data } = fakeStore();
    await reserveNearbyNotification(store, 'a', 'r');
    expect(await reserveNearbyNotification(store, 'a', 'r')).toEqual({ ok: false, reason: 'pair_cap' });
    expect(data.get(nearbyDailyKey('r'))).toBe(1);
  });

  it('la 4e émission distincte vers le même destinataire est refusée et libère la paire', async () => {
    const { store, data } = fakeStore();
    for (const e of ['a', 'b', 'c']) expect(await reserveNearbyNotification(store, e, 'r')).toEqual({ ok: true });
    expect(await reserveNearbyNotification(store, 'd', 'r')).toEqual({ ok: false, reason: 'daily_cap' });
    expect(data.get(nearbyDailyKey('r'))).toBe(NEARBY_DAILY_CAP);
    expect(data.has(nearbyPairKey('d', 'r'))).toBe(false);
  });

  it('les destinataires ont des quotas indépendants', async () => {
    const { store } = fakeStore();
    for (const e of ['a', 'b', 'c']) await reserveNearbyNotification(store, e, 'r1');
    expect(await reserveNearbyNotification(store, 'a', 'r2')).toEqual({ ok: true });
  });

  it('des réservations concurrentes ne dépassent jamais le plafond', async () => {
    const { store } = fakeStore();
    const results = await Promise.all(['a', 'b', 'c', 'd', 'e', 'f'].map((e) => reserveNearbyNotification(store, e, 'r')));
    expect(results.filter((r) => r.ok)).toHaveLength(NEARBY_DAILY_CAP);
  });
});
