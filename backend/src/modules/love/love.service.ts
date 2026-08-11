import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { createNotification } from '../notifications/notifications.service';
import { emitToUser } from '../../infrastructure/websocket';
import { createConversationForUsers } from '../messages/messages.service';
import { compatLove } from '../culture-engine/scoring';
import { matchesCreatedTotal } from '../../infrastructure/monitoring/metrics';

const CANDIDATES_TTL = 60 * 60; // 1h
const PASS_TTL = 30 * 24 * 60 * 60; // 30j
const SWIPED_TTL = 30 * 24 * 60 * 60;
const MAX_CANDIDATES = 50;

const candidatesKey = (userId: string) => `love:candidates:${userId}`;
const swipedKey = (userId: string) => `love:swiped:${userId}`;

export interface LoveCandidateDto {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  age: number | null;
  matchScore: number;
  sharedValues: string[];
}

function computeAge(birthdate: Date | null): number | null {
  if (!birthdate) return null;
  const diff = Date.now() - birthdate.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function toUserFeatures(row: {
  values: string[] | null;
  languages: string[] | null;
  ethnicity: string | null;
  country: string | null;
  region: string | null;
  interests?: string[];
}) {
  return {
    id: '',
    values: row.values,
    languages: row.languages,
    ethnicity: row.ethnicity,
    country: row.country,
    region: row.region,
    interests: row.interests ?? row.values ?? [],
  };
}

async function blockedIds(userId: string): Promise<string[]> {
  const rows = await db.select({ blockedId: schema.blocks.blockedId }).from(schema.blocks).where(eq(schema.blocks.blockerId, userId));
  return rows.map((r) => r.blockedId);
}

async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const rows = await db
    .select({ blockerId: schema.blocks.blockerId })
    .from(schema.blocks)
    .where(
      or(
        and(eq(schema.blocks.blockerId, a), eq(schema.blocks.blockedId, b)),
        and(eq(schema.blocks.blockerId, b), eq(schema.blocks.blockedId, a)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** GET /api/love/matches — candidats compatibles (cache 1h). */
export async function getLoveCandidates(userId: string): Promise<{ candidates: LoveCandidateDto[] }> {
  const cached = await redis.get(candidatesKey(userId));
  if (cached) return { candidates: JSON.parse(cached) as LoveCandidateDto[] };

  const [me] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!me) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  const blocked = await blockedIds(userId);
  const swiped = await redis.smembers(swipedKey(userId));
  const passed = await redis.smembers('love:passed:' + userId);

  const existingRows = await db
    .select({ candidateId: schema.loveMatches.candidateId })
    .from(schema.loveMatches)
    .where(eq(schema.loveMatches.userId, userId));
  const alreadyMatched = new Set(existingRows.map((r) => r.candidateId));

  const candidates = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      username: schema.users.username,
      avatar: schema.users.avatar,
      bio: schema.users.bio,
      location: schema.users.location,
      country: schema.users.country,
      region: schema.users.region,
      birthdate: schema.users.birthdate,
      profileCompleted: schema.users.profileCompleted,
      values: schema.users.values,
      languages: schema.users.languages,
      ethnicity: schema.users.ethnicity,
    })
    .from(schema.users)
    .where(eq(schema.users.profileCompleted, true))
    .limit(200);

  const excluded = new Set([userId, ...blocked, ...swiped, ...passed, ...alreadyMatched]);
  const eligible = candidates.filter((c) => {
    if (excluded.has(c.id)) return false;
    const age = computeAge(c.birthdate);
    if (age === null || age < 18) return false;
    return true;
  });

  const result: LoveCandidateDto[] = eligible.slice(0, MAX_CANDIDATES).map((c) => ({
    id: c.id,
    name: c.name,
    username: c.username,
    avatar: c.avatar,
    bio: c.bio,
    location: c.location,
    country: c.country,
    age: computeAge(c.birthdate),
    matchScore: compatLove(toUserFeatures(me), toUserFeatures(c)),
    sharedValues: (c.values ?? []).filter((v) => (me.values ?? []).includes(v)),
  }));

  await redis.set(candidatesKey(userId), JSON.stringify(result), 'EX', CANDIDATES_TTL);
  return { candidates: result };
}

/** GET /api/love/matches/:id — détail d'un candidat. */
export async function getLoveCandidate(userId: string, candidateId: string): Promise<{ candidate: LoveCandidateDto }> {
  const { candidates } = await getLoveCandidates(userId);
  const candidate = candidates.find((c) => c.id === candidateId);
  if (!candidate) throw AppError.notFound('Candidat introuvable', 'CANDIDATE_NOT_FOUND');
  return { candidate };
}

/** POST /api/love/swipe — like / pass. */
export async function swipe(userId: string, candidateId: string, action: 'like' | 'pass'): Promise<{ matched: boolean; conversationId?: string }> {
  if (userId === candidateId) throw AppError.badRequest('Impossible de swiper soi-même', 'SELF_SWIPE');
  if (await isBlockedBetween(userId, candidateId)) throw AppError.forbidden('Action impossible', 'BLOCKED');

  const [candidate] = await db.select().from(schema.users).where(eq(schema.users.id, candidateId)).limit(1);
  if (!candidate) throw AppError.notFound('Candidat introuvable', 'CANDIDATE_NOT_FOUND');
  const candidateAge = computeAge(candidate.birthdate);
  if (candidateAge === null || candidateAge < 18) {
    throw AppError.badRequest('Profil inéligible', 'CANDIDATE_NOT_ELIGIBLE');
  }

  const [me] = await db.select({ values: schema.users.values, languages: schema.users.languages, ethnicity: schema.users.ethnicity, country: schema.users.country, region: schema.users.region }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  const score = me ? compatLove(toUserFeatures(me), toUserFeatures(candidate)) : 0;

  const existing = await db
    .select()
    .from(schema.loveMatches)
    .where(and(eq(schema.loveMatches.userId, userId), eq(schema.loveMatches.candidateId, candidateId)))
    .limit(1);
  if (existing[0]) throw AppError.conflict('Déjà swipé', 'ALREADY_SWIPED');

  await redis.sadd(swipedKey(userId), candidateId);
  await redis.expire(swipedKey(userId), SWIPED_TTL);
  if (action === 'pass') {
    await redis.sadd('love:passed:' + userId, candidateId);
    await redis.expire('love:passed:' + userId, PASS_TTL);
  }
  await redis.del(candidatesKey(userId));

  if (action === 'pass') {
    await db.insert(schema.loveMatches).values({ userId, candidateId, action: 'pass', matchScore: score, isMutual: false });
    return { matched: false };
  }

  // Vérification match mutuel : le candidat doit avoir déjà liké ce user
  const reciprocal = await db
    .select()
    .from(schema.loveMatches)
    .where(and(eq(schema.loveMatches.userId, candidateId), eq(schema.loveMatches.candidateId, userId), eq(schema.loveMatches.action, 'like')))
    .limit(1);

  if (!reciprocal[0]) {
    await db.insert(schema.loveMatches).values({ userId, candidateId, action: 'like', matchScore: score, isMutual: false });
    await createNotification({ userId: candidateId, actorId: userId, type: 'match', action: 'like', target: userId });
    emitToUser(candidateId, 'love:like', { userId });
    return { matched: false };
  }

  // MATCH MUTUEL → transaction : conversation + notification + compagnon + WS
  const { id: conversationId } = await createConversationForUsers(userId, candidateId);

  await db.insert(schema.loveMatches).values({ userId, candidateId, action: 'like', isMutual: true, conversationId });
  await db.update(schema.loveMatches).set({ isMutual: true, conversationId }).where(and(eq(schema.loveMatches.userId, candidateId), eq(schema.loveMatches.candidateId, userId)));
  matchesCreatedTotal.inc();

  await db
    .insert(schema.connections)
    .values([
      { fromUserId: userId, toUserId: candidateId, status: 'companion', matchScore: score },
      { fromUserId: candidateId, toUserId: userId, status: 'companion', matchScore: score },
    ])
    .onConflictDoNothing();

  await db
    .update(schema.users)
    .set({ companionsCount: sql`${schema.users.companionsCount} + 1` })
    .where(inArray(schema.users.id, [userId, candidateId]));

  await createNotification({ userId, actorId: candidateId, type: 'match', action: 'match', target: candidateId, metadata: { conversationId } });
  await createNotification({ userId: candidateId, actorId: userId, type: 'match', action: 'match', target: userId, metadata: { conversationId } });

  emitToUser(userId, 'love:match', { userId: candidateId, conversationId });
  emitToUser(candidateId, 'love:match', { userId, conversationId });

  return { matched: true, conversationId };
}
