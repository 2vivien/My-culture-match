import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { createNotification } from '../notifications/notifications.service';
import { emitToUser } from '../../infrastructure/websocket';
import { createConversationForUsers } from '../messages/messages.service';
import { compatLove } from '../culture-engine/scoring';
import { matchesCreatedTotal } from '../../infrastructure/monitoring/metrics';
import { canLikeForLove } from '../consent/consent.service';
import { parseLoveQuery } from './love.ai';

const CANDIDATES_TTL = 60 * 60;
const PASS_TTL = 30 * 24 * 60 * 60;
const SWIPED_TTL = 30 * 24 * 60 * 60;
const MAX_CANDIDATES = 50;
const LOVE_SEARCH_LIMIT = 3;
const LOVE_SEARCH_WINDOW = 7 * 24 * 60 * 60;
const candidatesKey = (userId: string) => `love:candidates:${userId}`;
const swipedKey = (userId: string) => `love:swiped:${userId}`;
const pairLock = (a: string, b: string) => `love:pair:${[a, b].sort().join(':')}`;
const searchQuotaKey = (userId: string) => `love:search:quota:${userId}`;

export interface LoveCandidateDto { id: string; name: string; username: string; avatar: string | null; bio: string | null; location: string | null; country: string | null; gender: string | null; age: number | null; matchScore: number; sharedValues: string[]; }
export interface LoveSearchResult extends LoveCandidateDto { rank: number; reasons: string[]; breakdown: { values: number; goals: number; language: number; culture: number; interests: number }; }

function computeAge(birthdate: Date | null): number | null { if (!birthdate) return null; return Math.floor((Date.now() - birthdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)); }
function toUserFeatures(row: { values: string[] | null; languages: string[] | null; ethnicity: string | null; country: string | null; region: string | null; interests?: string[] }) { return { id: '', values: row.values, languages: row.languages, ethnicity: row.ethnicity, country: row.country, region: row.region, interests: row.interests ?? row.values ?? [] }; }
function normalized(value: string | null | undefined): string { return (value ?? '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
async function blockedIds(userId: string): Promise<string[]> { const rows = await db.select({ blockedId: schema.blocks.blockedId }).from(schema.blocks).where(eq(schema.blocks.blockerId, userId)); return rows.map((r) => r.blockedId); }
async function isBlockedBetween(a: string, b: string): Promise<boolean> { const rows = await db.select({ blockerId: schema.blocks.blockerId }).from(schema.blocks).where(or(and(eq(schema.blocks.blockerId, a), eq(schema.blocks.blockedId, b)), and(eq(schema.blocks.blockerId, b), eq(schema.blocks.blockedId, a)))).limit(1); return rows.length > 0; }

export async function getLoveCandidates(userId: string): Promise<{ candidates: LoveCandidateDto[] }> {
  const cached = await redis.get(candidatesKey(userId)); if (cached) return { candidates: JSON.parse(cached) as LoveCandidateDto[] };
  const [me] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1); if (!me) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  if (!(await import('../consent/consent.service').then((m) => m.getConsentSettings(userId))).loveEnabled) return { candidates: [] };
  const blocked = await blockedIds(userId); const swiped = await redis.smembers(swipedKey(userId)); const passed = await redis.smembers('love:passed:' + userId);
  const existingRows = await db.select({ candidateId: schema.loveMatches.candidateId }).from(schema.loveMatches).where(eq(schema.loveMatches.userId, userId)); const alreadyMatched = new Set(existingRows.map((r) => r.candidateId));
  const candidates = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar, bio: schema.users.bio, location: schema.users.location, country: schema.users.country, region: schema.users.region, birthdate: schema.users.birthdate, gender: schema.users.gender, profileCompleted: schema.users.profileCompleted, values: schema.users.values, languages: schema.users.languages, ethnicity: schema.users.ethnicity }).from(schema.users).where(eq(schema.users.profileCompleted, true)).limit(200);
  const excluded = new Set([userId, ...blocked, ...swiped, ...passed, ...alreadyMatched]); const eligible = candidates.filter((c) => !excluded.has(c.id) && (computeAge(c.birthdate) ?? 0) >= 18); const visible = [] as typeof eligible; for (const candidate of eligible) if (await canLikeForLove(userId, candidate.id)) visible.push(candidate);
  const result = visible.slice(0, MAX_CANDIDATES).map((c) => ({ id: c.id, name: c.name, username: c.username, avatar: c.avatar, bio: c.bio, location: c.location, country: c.country, gender: c.gender, age: computeAge(c.birthdate), matchScore: compatLove(toUserFeatures(me), toUserFeatures(c)), sharedValues: (c.values ?? []).filter((v) => (me.values ?? []).includes(v)) }));
  await redis.set(candidatesKey(userId), JSON.stringify(result), 'EX', CANDIDATES_TTL); return { candidates: result };
}

function overlap(a: string[] | null | undefined, b: string[]): number { const aa = new Set((a ?? []).map(normalized)); return b.filter((v) => aa.has(normalized(v))).length; }

export async function searchLove(userId: string, query: string): Promise<{ query: string; criteria: Awaited<ReturnType<typeof parseLoveQuery>>; results: LoveSearchResult[]; remainingSearches: number }> {
  const clean = query.trim(); if (clean.length < 3) throw AppError.badRequest('Décris un peu la personne que tu recherches', 'LOVE_QUERY_TOO_SHORT');
  const [me] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1); if (!me) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  const consent = await import('../consent/consent.service').then((m) => m.getConsentSettings(userId));
  if (!consent.loveEnabled) throw AppError.forbidden('Active Love dans tes préférences de consentement pour lancer une recherche', 'LOVE_DISABLED');
  const quota = await redis.incr(searchQuotaKey(userId)); if (quota === 1) await redis.expire(searchQuotaKey(userId), LOVE_SEARCH_WINDOW);
  if (quota > LOVE_SEARCH_LIMIT) { const ttl = await redis.ttl(searchQuotaKey(userId)); throw AppError.tooMany(`Tu as utilisé tes 3 recherches de la semaine. Réessaie dans ${Math.max(1, Math.ceil(ttl / 86400))} jour(s).`, 'LOVE_SEARCH_QUOTA'); }

  const criteria = await parseLoveQuery(clean);
  const blocked = await blockedIds(userId);
  const existingRows = await db.select({ candidateId: schema.loveMatches.candidateId }).from(schema.loveMatches).where(eq(schema.loveMatches.userId, userId));
  const excluded = new Set([userId, ...blocked, ...existingRows.map((r) => r.candidateId)]);
  const candidates = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar, bio: schema.users.bio, location: schema.users.location, country: schema.users.country, region: schema.users.region, birthdate: schema.users.birthdate, gender: schema.users.gender, values: schema.users.values, languages: schema.users.languages, ethnicity: schema.users.ethnicity, profileCompleted: schema.users.profileCompleted }).from(schema.users).where(eq(schema.users.profileCompleted, true)).limit(500);
  const visible = [] as typeof candidates;
  for (const c of candidates) {
    const age = computeAge(c.birthdate) ?? 0;
    if (excluded.has(c.id) || age < 18) continue;
    if (criteria.ageMin !== undefined && age < criteria.ageMin) continue;
    if (criteria.ageMax !== undefined && age > criteria.ageMax) continue;
    if (criteria.genders?.length && !criteria.genders.includes(c.gender ?? '')) continue;
    if (criteria.countries?.length && !criteria.countries.some((country) => normalized(country) === normalized(c.country))) continue;
    if (!(await canLikeForLove(userId, c.id))) continue;
    visible.push(c);
  }
  const meFeatures = toUserFeatures(me);
  const ranked = visible.map((c) => {
    const sharedValues = (c.values ?? []).filter((v) => (me.values ?? []).some((mine) => normalized(mine) === normalized(v)));
    const keywordOverlap = overlap([...(c.values ?? []), ...(c.languages ?? []), c.country, c.region, c.bio].filter(Boolean) as string[], criteria.keywords ?? []);
    const scoreBase = compatLove(meFeatures, toUserFeatures(c));
    const values = Math.min(100, Math.round(scoreBase * 0.45 + Math.min(100, sharedValues.length * 20) * 0.55));
    const goals = criteria.relationshipGoal ? 72 : 55;
    const language = overlap(c.languages, me.languages ?? []) > 0 ? 95 : 55;
    const culture = c.country && me.country && normalized(c.country) === normalized(me.country) ? 92 : 65;
    const interests = criteria.keywords?.length ? Math.min(100, 50 + keywordOverlap * 15) : 65;
    const score = Math.min(97, Math.max(50, Math.round(values * 0.4 + goals * 0.15 + language * 0.1 + culture * 0.15 + interests * 0.2)));
    const reasons: string[] = [];
    if (sharedValues.length) reasons.push(`${sharedValues.slice(0, 2).join(' et ')} en commun`);
    if (criteria.relationshipGoal === 'serious') reasons.push('Objectif orienté relation sérieuse');
    if (criteria.keywords?.some((k) => ['voyage', 'voyager'].includes(k)) && keywordOverlap > 0) reasons.push('Intérêt compatible avec les voyages');
    if (language > 80) reasons.push('Langues compatibles');
    if (culture > 85) reasons.push('Proximité culturelle intéressante');
    if (!reasons.length) reasons.push('Bonne compatibilité globale avec tes critères');
    return { id: c.id, name: c.name, username: c.username, avatar: c.avatar, bio: c.bio, location: c.location, country: c.country, gender: c.gender, age: computeAge(c.birthdate), matchScore: score, sharedValues, rank: 0, reasons: reasons.slice(0, 3), breakdown: { values, goals, language, culture, interests } };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4).map((r, i) => ({ ...r, rank: i + 1 }));
  return { query: clean, criteria, results: ranked, remainingSearches: Math.max(0, LOVE_SEARCH_LIMIT - quota) };
}

export async function getLoveSearchQuota(userId: string): Promise<{ limit: number; used: number; remaining: number }> {
  const value = Number(await redis.get(searchQuotaKey(userId))) || 0; return { limit: LOVE_SEARCH_LIMIT, used: Math.min(value, LOVE_SEARCH_LIMIT), remaining: Math.max(0, LOVE_SEARCH_LIMIT - value) };
}

export async function getActiveLoveMatches(userId: string): Promise<{ candidates: Array<LoveCandidateDto & { connected: boolean; conversationId: string | null }> }> {
  const rows = await db.select({ candidateId: schema.loveMatches.candidateId, conversationId: schema.loveMatches.conversationId, matchScore: schema.loveMatches.matchScore }).from(schema.loveMatches).where(and(eq(schema.loveMatches.userId, userId), eq(schema.loveMatches.isMutual, true))); if (rows.length === 0) return { candidates: [] };
  const ids = rows.map((r) => r.candidateId); const users = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar, bio: schema.users.bio, country: schema.users.country, location: schema.users.location, gender: schema.users.gender, birthdate: schema.users.birthdate }).from(schema.users).where(inArray(schema.users.id, ids)); const byId = new Map(users.map((u) => [u.id, u]));
  return { candidates: rows.flatMap((r) => { const u = byId.get(r.candidateId); if (!u) return []; return [{ id: u.id, name: u.name, username: u.username, avatar: u.avatar, bio: u.bio, location: u.location, country: u.country, gender: u.gender, age: computeAge(u.birthdate), matchScore: r.matchScore, sharedValues: [], connected: true, conversationId: r.conversationId }]; }) };
}
export async function getLoveCandidate(userId: string, candidateId: string): Promise<{ candidate: LoveCandidateDto }> { const { candidates } = await getLoveCandidates(userId); const candidate = candidates.find((c) => c.id === candidateId); if (!candidate) throw AppError.notFound('Candidat introuvable', 'CANDIDATE_NOT_FOUND'); return { candidate }; }

export async function swipe(userId: string, candidateId: string, action: 'like' | 'pass'): Promise<{ matched: boolean; conversationId?: string }> {
  if (userId === candidateId) throw AppError.badRequest('Impossible de swiper soi-même', 'SELF_SWIPE'); if (await isBlockedBetween(userId, candidateId)) throw AppError.forbidden('Action impossible', 'BLOCKED'); if (action === 'like' && !(await canLikeForLove(userId, candidateId))) throw AppError.forbidden('Cette personne n’accepte pas les interactions Love dans ses préférences de consentement', 'LOVE_CONSENT_REQUIRED');
  const [candidate] = await db.select().from(schema.users).where(eq(schema.users.id, candidateId)).limit(1); if (!candidate) throw AppError.notFound('Candidat introuvable', 'CANDIDATE_NOT_FOUND'); if ((computeAge(candidate.birthdate) ?? 0) < 18) throw AppError.badRequest('Profil inéligible', 'CANDIDATE_NOT_ELIGIBLE');
  const [me] = await db.select({ values: schema.users.values, languages: schema.users.languages, ethnicity: schema.users.ethnicity, country: schema.users.country, region: schema.users.region }).from(schema.users).where(eq(schema.users.id, userId)).limit(1); const score = me ? compatLove(toUserFeatures(me), toUserFeatures(candidate)) : 0;
  const existing = await db.select().from(schema.loveMatches).where(and(eq(schema.loveMatches.userId, userId), eq(schema.loveMatches.candidateId, candidateId))).limit(1); if (existing[0]) throw AppError.conflict('Déjà swipé', 'ALREADY_SWIPED');
  await redis.sadd(swipedKey(userId), candidateId); await redis.expire(swipedKey(userId), SWIPED_TTL); await redis.del(candidatesKey(userId));
  if (action === 'pass') { await redis.sadd('love:passed:' + userId, candidateId); await redis.expire('love:passed:' + userId, PASS_TTL); await db.insert(schema.loveMatches).values({ userId, candidateId, action: 'pass', matchScore: score, isMutual: false }); return { matched: false }; }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${pairLock(userId, candidateId)}))`);
    const reciprocal = await tx.select().from(schema.loveMatches).where(and(eq(schema.loveMatches.userId, candidateId), eq(schema.loveMatches.candidateId, userId), eq(schema.loveMatches.action, 'like'))).limit(1);
    if (!reciprocal[0]) { await tx.insert(schema.loveMatches).values({ userId, candidateId, action: 'like', matchScore: score, isMutual: false }); await createNotification({ userId: candidateId, actorId: userId, type: 'match', action: 'like', target: userId }); emitToUser(candidateId, 'love:like', { userId }); return { matched: false }; }
    const { id: conversationId } = await createConversationForUsers(userId, candidateId);
    await tx.insert(schema.loveMatches).values({ userId, candidateId, action: 'like', isMutual: true, conversationId }); await tx.update(schema.loveMatches).set({ isMutual: true, conversationId }).where(and(eq(schema.loveMatches.userId, candidateId), eq(schema.loveMatches.candidateId, userId))); matchesCreatedTotal.inc();
    await createNotification({ userId, actorId: candidateId, type: 'match', action: 'match', target: candidateId, metadata: { conversationId } }); await createNotification({ userId: candidateId, actorId: userId, type: 'match', action: 'match', target: userId, metadata: { conversationId } }); emitToUser(userId, 'love:match', { userId: candidateId, conversationId }); emitToUser(candidateId, 'love:match', { userId, conversationId });
    return { matched: true, conversationId };
  });
}

/** Durée de vie d'une requête Love en attente (jours). */
export const LOVE_REQUEST_TTL_DAYS = 30;

export interface LoveRequestDto { userId: string; name: string; username: string; avatar: string | null; bio: string | null; country: string | null; location: string | null; age: number | null; matchScore: number; receivedAt: string; }

/**
 * Requêtes Love reçues et en attente : un like d'une personne vers moi, auquel je n'ai pas encore répondu.
 * Un like réciproque = acceptation (cf. swipe) ; un pass = refus. Les blocages et consentements sont ré-appliqués à la lecture.
 */
export async function getIncomingLoveRequests(userId: string): Promise<{ requests: LoveRequestDto[] }> {
  const since = new Date(Date.now() - LOVE_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000);
  const incoming = await db.select({ fromId: schema.loveMatches.userId, matchScore: schema.loveMatches.matchScore, createdAt: schema.loveMatches.createdAt })
    .from(schema.loveMatches)
    .where(and(eq(schema.loveMatches.candidateId, userId), eq(schema.loveMatches.action, 'like'), eq(schema.loveMatches.isMutual, false), sql`${schema.loveMatches.createdAt} > ${since}`));
  if (incoming.length === 0) return { requests: [] };

  const answered = await db.select({ candidateId: schema.loveMatches.candidateId }).from(schema.loveMatches).where(eq(schema.loveMatches.userId, userId));
  const answeredIds = new Set(answered.map((r) => r.candidateId));
  const blocked = new Set(await blockedIds(userId));
  const blockedMe = await db.select({ blockerId: schema.blocks.blockerId }).from(schema.blocks).where(eq(schema.blocks.blockedId, userId));
  for (const b of blockedMe) blocked.add(b.blockerId);

  const pending = incoming.filter((r) => !answeredIds.has(r.fromId) && !blocked.has(r.fromId));
  if (pending.length === 0) return { requests: [] };
  if (!(await import('../consent/consent.service').then((m) => m.getConsentSettings(userId))).loveEnabled) return { requests: [] };

  const rows = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar, bio: schema.users.bio, country: schema.users.country, location: schema.users.location, birthdate: schema.users.birthdate })
    .from(schema.users).where(inArray(schema.users.id, pending.map((r) => r.fromId)));
  const byId = new Map(rows.map((u) => [u.id, u]));
  const requests = pending.flatMap((r): LoveRequestDto[] => {
    const u = byId.get(r.fromId);
    if (!u || (computeAge(u.birthdate) ?? 0) < 18) return [];
    return [{ userId: u.id, name: u.name, username: u.username, avatar: u.avatar, bio: u.bio, country: u.country, location: u.location, age: computeAge(u.birthdate), matchScore: r.matchScore, receivedAt: r.createdAt.toISOString() }];
  }).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  return { requests };
}

/** Accepter = répondre par un like : le match mutuel et la conversation sont créés par swipe(). */
export async function acceptLoveRequest(userId: string, fromUserId: string): Promise<{ matched: boolean; conversationId?: string }> {
  await assertPendingLoveRequest(userId, fromUserId);
  return swipe(userId, fromUserId, 'like');
}

/** Refuser = pass : la requête disparaît sans conversation ni notification à l'émetteur. */
export async function declineLoveRequest(userId: string, fromUserId: string): Promise<{ matched: false }> {
  await assertPendingLoveRequest(userId, fromUserId);
  await swipe(userId, fromUserId, 'pass');
  return { matched: false };
}

async function assertPendingLoveRequest(userId: string, fromUserId: string): Promise<void> {
  if (userId === fromUserId) throw AppError.badRequest('Requête invalide', 'SELF_REQUEST');
  const since = new Date(Date.now() - LOVE_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000);
  const [row] = await db.select({ id: schema.loveMatches.id }).from(schema.loveMatches)
    .where(and(eq(schema.loveMatches.userId, fromUserId), eq(schema.loveMatches.candidateId, userId), eq(schema.loveMatches.action, 'like'), eq(schema.loveMatches.isMutual, false), sql`${schema.loveMatches.createdAt} > ${since}`)).limit(1);
  if (!row) throw AppError.notFound('Requête Love introuvable ou expirée', 'LOVE_REQUEST_NOT_FOUND');
}
