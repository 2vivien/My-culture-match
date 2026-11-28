import { and, eq, inArray, isNotNull, or } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { haversineKm } from '../users/users.service';
import type { ConsentSettings } from './consent.schema';
import { visibilityAllows, fieldAccess, relationFlagsFor, type FieldAccess } from './consent.policy';
import { isAdultForLove } from '../love/love.rules';

const DEFAULTS: Omit<ConsentSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = { discoveryVisibility: 'everyone', requestVisibility: 'everyone', loveLikeVisibility: 'everyone', contactVisibility: 'friends', profileVisibility: 'everyone', photosVisibility: 'everyone', countryVisibility: 'everyone', friendshipEnabled: true, loveEnabled: false, loveProposalEnabled: true };
const VISIBILITIES = ['nobody', 'friends', 'friends_of_friends', 'nearby', 'everyone'] as const;
function validVisibility(value: unknown): boolean { return typeof value === 'string' && VISIBILITIES.includes(value as typeof VISIBILITIES[number]); }

export async function getConsentSettings(userId: string): Promise<ConsentSettings> { const [row] = await db.select().from(schema.consentSettings).where(eq(schema.consentSettings.userId, userId)).limit(1); if (row) return row; const [created] = await db.insert(schema.consentSettings).values({ userId, ...DEFAULTS }).returning(); if (!created) throw AppError.badRequest('Impossible de créer les préférences de consentement', 'CONSENT_CREATE_FAILED'); return created; }
export async function updateConsentSettings(userId: string, patch: Partial<Omit<typeof DEFAULTS, never>>): Promise<ConsentSettings> { const current = await getConsentSettings(userId); const keys = ['discoveryVisibility','requestVisibility','loveLikeVisibility','contactVisibility','profileVisibility','photosVisibility','countryVisibility'] as const; for (const key of keys) if (patch[key] !== undefined && !validVisibility(patch[key])) throw AppError.badRequest(`Valeur invalide pour ${key}`, 'INVALID_CONSENT_VISIBILITY'); if (patch.loveEnabled === true) { const [u] = await db.select({ birthdate: schema.users.birthdate }).from(schema.users).where(eq(schema.users.id, userId)).limit(1); if (!isAdultForLove(u?.birthdate)) throw AppError.forbidden('Love est réservé aux personnes majeures : renseigne ta date de naissance (18 ans minimum)', 'LOVE_ADULT_REQUIRED'); } if (patch.loveEnabled === false) patch.loveProposalEnabled = false; const [updated] = await db.update(schema.consentSettings).set({ ...patch, updatedAt: new Date() }).where(eq(schema.consentSettings.userId, userId)).returning(); if (!updated) throw AppError.notFound('Préférences introuvables', 'CONSENT_NOT_FOUND'); return updated ?? current; }
async function relationFlags(viewerId: string, targetId: string): Promise<{ friend: boolean; fof: boolean; nearby: boolean }> { const rows = await db.select({ from: schema.connections.fromUserId, to: schema.connections.toUserId, status: schema.connections.status }).from(schema.connections).where(and(or(eq(schema.connections.fromUserId, viewerId), eq(schema.connections.toUserId, viewerId)), inArray(schema.connections.status, ['companion']))); const friends = new Set(rows.map((r) => (r.from === viewerId ? r.to : r.from))); if (friends.has(targetId)) return { friend: true, fof: true, nearby: false }; const nearby = await isNearby(viewerId, targetId); if (friends.size === 0) return { friend: false, fof: false, nearby }; const friendIds = [...friends]; const second = await db.select({ from: schema.connections.fromUserId, to: schema.connections.toUserId }).from(schema.connections).where(and(inArray(schema.connections.status, ['companion']), or(inArray(schema.connections.fromUserId, friendIds), inArray(schema.connections.toUserId, friendIds)))); const fof = second.some((r) => { const other = friendIds.includes(r.from) ? r.to : r.from; return other === targetId; }); return { friend: false, fof, nearby }; }
async function isNearby(viewerId: string, targetId: string): Promise<boolean> { const rows = await db.select({ id: schema.users.id, latitude: schema.users.latitude, longitude: schema.users.longitude }).from(schema.users).where(inArray(schema.users.id, [viewerId, targetId])); if (rows.length !== 2 || rows.some((r) => r.latitude === null || r.longitude === null)) return false; const a = rows.find((r) => r.id === viewerId)!; const b = rows.find((r) => r.id === targetId)!; return haversineKm(a.latitude!, a.longitude!, b.latitude!, b.longitude!) <= 50; }
async function isBlockedEitherWay(a: string, b: string): Promise<boolean> { const rows = await db.select({ blockerId: schema.blocks.blockerId }).from(schema.blocks).where(or(and(eq(schema.blocks.blockerId, a), eq(schema.blocks.blockedId, b)), and(eq(schema.blocks.blockerId, b), eq(schema.blocks.blockedId, a)))).limit(1); return rows.length > 0; }
/** Un compte banni n'apparaît ni n'interagit dans Love (comme canDiscover). */
async function anyBanned(ids: string[]): Promise<boolean> { const rows = await db.select({ id: schema.users.id }).from(schema.users).where(and(inArray(schema.users.id, ids), isNotNull(schema.users.bannedAt))).limit(1); return rows.length > 0; }
export async function canDiscover(viewerId: string, targetId: string): Promise<boolean> { if (viewerId === targetId) return true; const [target] = await db.select({ bannedAt: schema.users.bannedAt }).from(schema.users).where(eq(schema.users.id, targetId)).limit(1); if (!target || target.bannedAt) return false; const blocked = await db.select({ blockerId: schema.blocks.blockerId }).from(schema.blocks).where(or(and(eq(schema.blocks.blockerId, viewerId), eq(schema.blocks.blockedId, targetId)), and(eq(schema.blocks.blockerId, targetId), eq(schema.blocks.blockedId, viewerId)))).limit(1); if (blocked.length) return false; return visibilityAllows((await getConsentSettings(targetId)).discoveryVisibility, await relationFlags(viewerId, targetId)); }
export async function canSendFriendRequest(viewerId: string, targetId: string): Promise<boolean> { const settings = await getConsentSettings(targetId); if (!settings.friendshipEnabled) return false; return visibilityAllows(settings.requestVisibility, await relationFlags(viewerId, targetId)); }
export async function canLikeForLove(viewerId: string, targetId: string): Promise<boolean> { if (await isBlockedEitherWay(viewerId, targetId)) return false; if (await anyBanned([viewerId, targetId])) return false; const [viewer, target] = await Promise.all([getConsentSettings(viewerId), getConsentSettings(targetId)]); if (!viewer.loveEnabled || !target.loveEnabled || !target.loveProposalEnabled) return false; return visibilityAllows(target.loveLikeVisibility, await relationFlags(viewerId, targetId)); }
export async function canContact(viewerId: string, targetId: string): Promise<boolean> { const settings = await getConsentSettings(targetId); return visibilityAllows(settings.contactVisibility, await relationFlags(viewerId, targetId)); }
export async function canViewField(viewerId: string, targetId: string, field: 'profile' | 'photos' | 'country'): Promise<boolean> { if (viewerId === targetId) return true; const settings = await getConsentSettings(targetId); const key = field === 'profile' ? settings.profileVisibility : field === 'photos' ? settings.photosVisibility : settings.countryVisibility; return visibilityAllows(key, await relationFlags(viewerId, targetId)); }

/**
 * Champs visibles pour un lecteur chez plusieurs personnes, en un nombre fixe de requêtes (listes Love :
 * 200 à 500 profils). Même règle que canViewField ; une personne sans réglages garde les valeurs par défaut.
 */
export async function viewableFieldsFor(viewerId: string, targetIds: string[]): Promise<Map<string, FieldAccess>> {
  const out = new Map<string, FieldAccess>();
  const ids = [...new Set(targetIds)].filter((id) => id !== viewerId);
  if (targetIds.includes(viewerId)) out.set(viewerId, { profile: true, photos: true, country: true });
  if (ids.length === 0) return out;
  const [settingsRows, companionRows, positions] = await Promise.all([
    db.select().from(schema.consentSettings).where(inArray(schema.consentSettings.userId, ids)),
    db.select({ from: schema.connections.fromUserId, to: schema.connections.toUserId }).from(schema.connections).where(and(or(eq(schema.connections.fromUserId, viewerId), eq(schema.connections.toUserId, viewerId)), inArray(schema.connections.status, ['companion']))),
    db.select({ id: schema.users.id, latitude: schema.users.latitude, longitude: schema.users.longitude }).from(schema.users).where(inArray(schema.users.id, [viewerId, ...ids])),
  ]);
  const friends = new Set(companionRows.map((r) => (r.from === viewerId ? r.to : r.from)));
  const friendsOfFriends = new Set<string>();
  if (friends.size > 0) {
    const friendIds = [...friends];
    const second = await db.select({ from: schema.connections.fromUserId, to: schema.connections.toUserId }).from(schema.connections).where(and(inArray(schema.connections.status, ['companion']), or(inArray(schema.connections.fromUserId, friendIds), inArray(schema.connections.toUserId, friendIds))));
    for (const r of second) friendsOfFriends.add(friendIds.includes(r.from) ? r.to : r.from);
  }
  const me = positions.find((p) => p.id === viewerId);
  const nearby = new Set<string>();
  if (me && me.latitude !== null && me.longitude !== null) for (const p of positions) if (p.id !== viewerId && p.latitude !== null && p.longitude !== null && haversineKm(me.latitude, me.longitude, p.latitude, p.longitude) <= 50) nearby.add(p.id);
  const byUser = new Map(settingsRows.map((r) => [r.userId, r]));
  for (const id of ids) out.set(id, fieldAccess(byUser.get(id) ?? DEFAULTS, relationFlagsFor(id, { friends, friendsOfFriends, nearby })));
  return out;
}
