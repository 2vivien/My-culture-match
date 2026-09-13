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

const CANDIDATES_TTL = 60 * 60;
const PASS_TTL = 30 * 24 * 60 * 60;
const SWIPED_TTL = 30 * 24 * 60 * 60;
const MAX_CANDIDATES = 50;

const candidatesKey = (userId: string) => `love:candidates:${userId}`;
const swipedKey = (userId: string) => `love:swiped:${userId}`;
const pairLock = (a: string, b: string) => `love:pair:${[a, b].sort().join(':')}`;

export interface LoveCandidateDto {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  gender: string | null;
  age: number | null;
  matchScore: number;
  sharedValues: string[];
}

function computeAge(birthdate: Date | null): number | null {
  if (!birthdate) return null;
  return Math.floor((Date.now() - birthdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function toUserFeatures(row: { values: string[] | null; languages: string[] | null; ethnicity: string | null; country: string | null; region: string | null; interests?: string[] }) {
  return { id: '', values: row.values, languages: row.languages, ethnicity: row.ethnicity, country: row.country, region: row.region, interests: row.interests ?? row.values ?? [] };
}

async function blockedIds(userId: string): Promise<string[]> {
  const rows = await db.select({ blockedId: schema.blocks.blockedId }).from(schema.blocks).where(eq(schema.blocks.blockerId, userId));
  return rows.map((r) => r.blockedId);
}

async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const rows = await db.select({ blockerId: schema.blocks.blockerId }).from(schema.blocks).where(or(and(eq(schema.blocks.blockerId, a), eq(schema.blocks.blockedId, b)), and(eq(schema.blocks.blockerId, b), eq(schema.blocks.blockedId, a)))).limit(1);
  return rows.length > 0;
}

export async function getLoveCandidates(userId: string): Promise<{ candidates: LoveCandidateDto[] }> {
  const cached = await redis.get(candidatesKey(userId));
  if (cached) return { candidates: JSON.parse(cached) as LoveCandidateDto[] };
  const [me] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!me) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  const consent = await import('../consent/consent.service').then((m) => m.getConsentSettings(userId));
  if (!consent.loveEnabled) return { candidates: [] };
  const blocked = await blockedIds(userId);
  const swiped = await redis.smembers(swipedKey(userId));
  const passed = await redis.smembers('love:passed:' + userId);
  const existingRows = await db.select({ candidateId: schema.loveMatches.candidateId }).from(schema.loveMatches).where(eq(schema.loveMatches.userId, userId));
  const alreadyMatched = new Set(existingRows.map((r) => r.candidateId));
  const candidates = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar, bio: schema.users.bio, location: schema.users.location, country: schema.users.country, region: schema.users.region, birthdate: schema.users.birthdate, gender: schema.users.gender, profileCompleted: schema.users.profileCompleted, values: schema.users.values, languages: schema.users.languages, ethnicity: schema.users.ethnicity }).from(schema.users).where(eq(schema.users.profileCompleted, true)).limit(200);
  const excluded = new Set([userId, ...blocked, ...swiped, ...passed, ...alreadyMatched]);
  const eligible = candidates.filter((c) => { if (excluded.has(c.id)) return false; const age = computeAge(c.birthdate); return age !== null && age >= 18; });
  const visible = [] as typeof eligible;
  for (const candidate of eligible) if (await canLikeForLove(userId, candidate.id)) visible.push(candidate);
  const result = visible.slice(0, MAX_CANDIDATES).map((c) => ({ id: c.id, name: c.name, username: c.username, avatar: c.avatar, bio: c.bio, location: c.location, country: c.country, gender: c.gender, age: computeAge(c.birthdate), matchScore: compatLove(toUserFeatures(me), toUserFeatures(c)), sharedValues: (c.values ?? []).filter((v) => (me.values ?? []).includes(v)) }));
  await redis.set(candidatesKey(userId), JSON.stringify(result), 'EX', CANDIDATES_TTL);
  return { candidates: result };
}

export async function getActiveLoveMatches(userId: string): Promise<{ candidates: Array<LoveCandidateDto & { connected: boolean; conversationId: string | null }> }> {
  const rows = await db.select({ candidateId: schema.loveMatches.candidateId, conversationId: schema.loveMatches.conversationId, matchScore: schema.loveMatches.matchScore }).from(schema.loveMatches).where(and(eq(schema.loveMatches.userId, userId), eq(schema.loveMatches.isMutual, true)));
  if (rows.length === 0) return { candidates: [] };
  const ids = rows.map((r) => r.candidateId);
  const users = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar, bio: schema.users.bio, country: schema.users.country, location: schema.users.location, gender: schema.users.gender, birthdate: schema.users.birthdate }).from(schema.users).where(inArray(schema.users.id, ids));
  const byId = new Map(users.map((u) => [u.id, u]));
  return { candidates: rows.flatMap((r) => { const u = byId.get(r.candidateId); if (!u) return []; return [{ id: u.id, name: u.name, username: u.username, avatar: u.avatar, bio: u.bio, location: u.location, country: u.country, gender: u.gender, age: computeAge(u.birthdate), matchScore: r.matchScore, sharedValues: [], connected: true, conversationId: r.conversationId }]; }) };
}

export async function getLoveCandidate(userId: string, candidateId: string): Promise<{ candidate: LoveCandidateDto }> {
  const { candidates } = await getLoveCandidates(userId);
  const candidate = candidates.find((c) => c.id === candidateId);
  if (!candidate) throw AppError.notFound('Candidat introuvable', 'CANDIDATE_NOT_FOUND');
  return { candidate };
}

export async function swipe(userId: string, candidateId: string, action: 'like' | 'pass'): Promise<{ matched: boolean; conversationId?: string }> {
  if (userId === candidateId) throw AppError.badRequest('Impossible de swiper soi-même', 'SELF_SWIPE');
  if (await isBlockedBetween(userId, candidateId)) throw AppError.forbidden('Action impossible', 'BLOCKED');
  if (action === 'like' && !(await canLikeForLove(userId, candidateId))) throw AppError.forbidden('Cette personne n’accepte pas les interactions Love dans ses préférences de consentement', 'LOVE_CONSENT_REQUIRED');
  const [candidate] = await db.select().from(schema.users).where(eq(schema.users.id, candidateId)).limit(1);
  if (!candidate) throw AppError.notFound('Candidat introuvable', 'CANDIDATE_NOT_FOUND');
  const candidateAge = computeAge(candidate.birthdate);
  if (candidateAge === null || candidateAge < 18) throw AppError.badRequest('Profil inéligible', 'CANDIDATE_NOT_ELIGIBLE');
  const [me] = await db.select({ values: schema.users.values, languages: schema.users.languages, ethnicity: schema.users.ethnicity, country: schema.users.country, region: schema.users.region }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  const score = me ? compatLove(toUserFeatures(me), toUserFeatures(candidate)) : 0;
  const existing = await db.select().from(schema.loveMatches).where(and(eq(schema.loveMatches.userId, userId), eq(schema.loveMatches.candidateId, candidateId))).limit(1);
  if (existing[0]) throw AppError.conflict('Déjà swipé', 'ALREADY_SWIPED');
  await redis.sadd(swipedKey(userId), candidateId); await redis.expire(swipedKey(userId), SWIPED_TTL); await redis.del(candidatesKey(userId));
  if (action === 'pass') { await redis.sadd('love:passed:' + userId, candidateId); await redis.expire('love:passed:' + userId, PASS_TTL); await db.insert(schema.loveMatches).values({ userId, candidateId, action: 'pass', matchScore: score, isMutual: false }); return { matched: false }; }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${pairLock(userId, candidateId)}))`);
    const reciprocal = await tx.select().from(schema.loveMatches).where(and(eq(schema.loveMatches.userId, candidateId), eq(schema.loveMatches.candidateId, userId), eq(schema.loveMatches.action, 'like'))).limit(1);
    if (!reciprocal[0]) { await tx.insert(schema.loveMatches).values({ userId, candidateId, action: 'like', matchScore: score, isMutual: false }); await createNotification({ userId: candidateId, actorId: userId, type: 'match', action: 'like', target: userId }); emitToUser(candidateId, 'love:like', { userId }); return { matched: false }; }
    const { id: conversationId } = await createConversationForUsers(userId, candidateId);
    await tx.insert(schema.loveMatches).values({ userId, candidateId, action: 'like', isMutual: true, conversationId });
    await tx.update(schema.loveMatches).set({ isMutual: true, conversationId }).where(and(eq(schema.loveMatches.userId, candidateId), eq(schema.loveMatches.candidateId, userId)));
    matchesCreatedTotal.inc();
    await tx.insert(schema.connections).values([{ fromUserId: userId, toUserId: candidateId, status: 'companion', matchScore: score }, { fromUserId: candidateId, toUserId: userId, status: 'companion', matchScore: score }]).onConflictDoNothing();
    await tx.update(schema.users).set({ companionsCount: sql`${schema.users.companionsCount} + 1` }).where(inArray(schema.users.id, [userId, candidateId]));
    await createNotification({ userId, actorId: candidateId, type: 'match', action: 'match', target: candidateId, metadata: { conversationId } });
    await createNotification({ userId: candidateId, actorId: userId, type: 'match', action: 'match', target: userId, metadata: { conversationId } });
    emitToUser(userId, 'love:match', { userId: candidateId, conversationId }); emitToUser(candidateId, 'love:match', { userId, conversationId });
    return { matched: true, conversationId };
  });
}
