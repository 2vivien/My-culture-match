import { canSeeLocation, shouldHideLocation, type AudienceMode, type LocationVisibility } from './location.policy';

/**
 * Notification discrète « X est près de toi » — logique PURE (aucune dépendance base/redis).
 *
 * Confidentialité :
 *  - opt-in explicite de la personne qui REÇOIT (désactivé par défaut) ;
 *  - l'émetteur doit être réellement visible pour le destinataire, selon exactement `canSeeLocation`
 *    (visibilité, audience, blocages, fantôme, expiration) ;
 *  - la notification ne contient jamais de position ni de distance : la distance ne sert qu'à décider ;
 *  - plafonds stricts : 1 notification par paire (émetteur, destinataire) / 24 h, 3 par destinataire / 24 h.
 */

/** Rayon de « près de toi » (km). Sert uniquement à décider, jamais exposé. */
export const NEARBY_NOTIFY_RADIUS_KM = 5;
/** La position du destinataire doit être récente pour que « près de toi » ait un sens. */
export const NEARBY_RECIPIENT_FRESH_MS = 30 * 60 * 1000;
export const NEARBY_PAIR_TTL_SECONDS = 24 * 60 * 60;
export const NEARBY_DAILY_CAP = 3;
export const NEARBY_DAILY_TTL_SECONDS = 24 * 60 * 60;
/** Au plus un balayage de destinataires par émetteur toutes les 5 minutes (protège le chemin du heartbeat). */
export const NEARBY_SCAN_THROTTLE_SECONDS = 5 * 60;

export type NearbyNotifyDenial =
  | 'self'
  | 'blocked'
  | 'emitter_hidden'
  | 'recipient_not_opted_in'
  | 'recipient_location_unavailable'
  | 'not_visible'
  | 'too_far'
  | 'pair_cap'
  | 'daily_cap';

export interface NearbyNotifyInput {
  emitterId: string;
  recipientId: string;
  emitter: {
    sharingEnabled: boolean;
    ghostMode: boolean;
    expiresAt: Date | null;
    visibility: LocationVisibility;
    mode: AudienceMode;
  };
  /** Relation vue depuis la position de l'émetteur : le destinataire est-il ami / ami d'ami / listé / bloqué ? */
  relation: { blocked: boolean; isFriend: boolean; isFriendOfFriend: boolean; listed: boolean };
  recipient: { optIn: boolean; sharingEnabled: boolean; locationUpdatedAt: Date | null };
  /** Distance serveur entre les deux positions ; null si inconnue. Jamais transmise. */
  distanceKm: number | null;
  /** Compteurs déjà consommés (lecture seule : la réservation atomique se fait via `reserveNearbyNotification`). */
  pairAlreadyNotified: boolean;
  recipientDailyCount: number;
}

export type NearbyNotifyDecision = { notify: true } | { notify: false; reason: NearbyNotifyDenial };

const deny = (reason: NearbyNotifyDenial): NearbyNotifyDecision => ({ notify: false, reason });

export function decideNearbyNotification(input: NearbyNotifyInput, now = Date.now()): NearbyNotifyDecision {
  if (input.emitterId === input.recipientId) return deny('self');
  // Un blocage dans un sens ou dans l'autre coupe tout.
  if (input.relation.blocked) return deny('blocked');
  // Un utilisateur fantôme, sans partage ou dont le partage a expiré n'émet rien.
  if (shouldHideLocation({ sharingEnabled: input.emitter.sharingEnabled, ghostMode: input.emitter.ghostMode, expiresAt: input.emitter.expiresAt }, now)) {
    return deny('emitter_hidden');
  }
  if (!input.recipient.optIn) return deny('recipient_not_opted_in');
  const updated = input.recipient.locationUpdatedAt;
  if (!input.recipient.sharingEnabled || !updated || now - updated.getTime() > NEARBY_RECIPIENT_FRESH_MS) {
    return deny('recipient_location_unavailable');
  }
  // Mêmes règles que la carte : si l'émetteur n'apparaîtrait pas sur la carte du destinataire, aucune notification.
  if (!canSeeLocation({ visibility: input.emitter.visibility, mode: input.emitter.mode, listed: input.relation.listed, isFriend: input.relation.isFriend, isFriendOfFriend: input.relation.isFriendOfFriend })) {
    return deny('not_visible');
  }
  if (input.distanceKm === null || !Number.isFinite(input.distanceKm) || input.distanceKm > NEARBY_NOTIFY_RADIUS_KM) return deny('too_far');
  if (input.pairAlreadyNotified) return deny('pair_cap');
  if (input.recipientDailyCount >= NEARBY_DAILY_CAP) return deny('daily_cap');
  return { notify: true };
}

export const nearbyPairKey = (emitterId: string, recipientId: string) => `nearby:notif:pair:${emitterId}:${recipientId}`;
export const nearbyDailyKey = (recipientId: string) => `nearby:notif:day:${recipientId}`;
export const nearbyScanKey = (emitterId: string) => `nearby:notif:scan:${emitterId}`;

/** Sous-ensemble de ioredis utilisé pour les plafonds (permet un faux store en test). */
export interface NearbyQuotaStore {
  set(key: string, value: string, mode: 'EX', seconds: number, flag: 'NX'): Promise<'OK' | null>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
}

/**
 * Réserve atomiquement les deux plafonds AVANT l'envoi. À appeler après `decideNearbyNotification`
 * (qui ne fait que lire) : deux heartbeats concurrents ne peuvent pas dépasser les plafonds.
 * Si le plafond journalier est atteint, la réservation de la paire est annulée.
 */
export async function reserveNearbyNotification(
  store: NearbyQuotaStore,
  emitterId: string,
  recipientId: string,
): Promise<{ ok: true } | { ok: false; reason: 'pair_cap' | 'daily_cap' }> {
  const pairKey = nearbyPairKey(emitterId, recipientId);
  const claimed = await store.set(pairKey, '1', 'EX', NEARBY_PAIR_TTL_SECONDS, 'NX');
  if (claimed !== 'OK') return { ok: false, reason: 'pair_cap' };
  const dailyKey = nearbyDailyKey(recipientId);
  const used = await store.incr(dailyKey);
  if (used === 1) await store.expire(dailyKey, NEARBY_DAILY_TTL_SECONDS);
  if (used > NEARBY_DAILY_CAP) {
    await store.decr(dailyKey);
    await store.del(pairKey);
    return { ok: false, reason: 'daily_cap' };
  }
  return { ok: true };
}
