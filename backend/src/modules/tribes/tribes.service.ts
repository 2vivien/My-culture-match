import { eq, and, ne, lt, desc, or, sql, ilike, inArray } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { recordAudit } from '../audit/audit.service';
import { getPostsByIds } from '../posts/posts.service';
import type { CreateTribeInput, PatchTribeInput, CreateRuleInput, PatchRuleInput } from './tribes.schemas';

const MAX_TRIBES_PER_USER = 5;

type TribeRow = typeof schema.tribes.$inferSelect;

const tribeCacheKey = (id: string) => `tribe:${id}`;
const tribeMembersKey = (id: string) => `tribe:${id}:members`;
const tribePostsKey = (id: string) => `tribe:${id}:posts`;
export const tribeVisitorsKey = (id: string) => `tribe:${id}:visitors`;

export interface TribeDetail {
  id: string;
  name: string;
  tag: string;
  topic: string | null;
  description: string | null;
  avatar: string | null;
  banner: string | null;
  glow: string;
  membersCount: number;
  visitorsCount: number;
  postsCount: number;
  role: string | null;
  joined: boolean;
  rules: Array<{ number: number; title: string; description: string | null }>;
  moderators: Array<{ userId: string; role: string; name: string }>;
  createdAt: string;
}

async function isMember(tribeId: string, userId: string): Promise<{ role: string } | null> {
  const [row] = await db
    .select({ role: schema.tribeMembers.role })
    .from(schema.tribeMembers)
    .where(and(eq(schema.tribeMembers.tribeId, tribeId), eq(schema.tribeMembers.userId, userId)))
    .limit(1);
  return row ?? null;
}

async function findTribe(tribeId: string): Promise<TribeRow> {
  const [tribe] = await db.select().from(schema.tribes).where(eq(schema.tribes.id, tribeId)).limit(1);
  if (!tribe) throw AppError.notFound('Tribu introuvable', 'TRIBE_NOT_FOUND');
  return tribe;
}

function hasModRole(role: string | null | undefined): boolean {
  return role === 'moderator' || role === 'owner';
}

/** GET /api/tribes — liste paginée + recherche. */
export async function listTribes(search: string | undefined, cursor: string | undefined, limit: number): Promise<{ tribes: Array<Record<string, unknown>>; nextCursor: string | null }> {
  const query = db
    .select({
      id: schema.tribes.id,
      name: schema.tribes.name,
      tag: schema.tribes.tag,
      topic: schema.tribes.topic,
      description: schema.tribes.desc,
      avatar: schema.tribes.avatar,
      glow: schema.tribes.glow,
      membersCount: schema.tribes.memberCount,
      visitorsCount: schema.tribes.visitors,
      createdAt: schema.tribes.createdAt,
    })
    .from(schema.tribes)
    .where(
      and(
        search ? or(ilike(schema.tribes.name, `%${search}%`), ilike(schema.tribes.tag ?? '', `%${search}%`)) : undefined,
        cursor ? lt(schema.tribes.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(schema.tribes.createdAt))
    .limit(limit + 1);

  const rows = await query;
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;
  return { tribes: page, nextCursor };
}

/** GET /api/tribes/mine — tribus de l'utilisateur (owner d'abord, + récentes d'abord). */
export async function listMyTribes(userId: string): Promise<Array<Record<string, unknown>>> {
  const rows = await db
    .select({
      id: schema.tribes.id,
      name: schema.tribes.name,
      tag: schema.tribes.tag,
      topic: schema.tribes.topic,
      description: schema.tribes.desc,
      avatar: schema.tribes.avatar,
      glow: schema.tribes.glow,
      membersCount: schema.tribes.memberCount,
      role: schema.tribeMembers.role,
      createdAt: schema.tribes.createdAt,
    })
    .from(schema.tribeMembers)
    .innerJoin(schema.tribes, eq(schema.tribes.id, schema.tribeMembers.tribeId))
    .where(eq(schema.tribeMembers.userId, userId))
    .orderBy(desc(schema.tribes.createdAt))
    .limit(25);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/** Vérifie que name/tag sont libres (check applicatif doublant la contrainte DB unique). */
async function ensureUniqueIdentity(name: string, tag: string, excludeId?: string): Promise<void> {
  const [row] = await db
    .select({ id: schema.tribes.id, name: schema.tribes.name, tag: schema.tribes.tag })
    .from(schema.tribes)
    .where(
      and(
        or(eq(schema.tribes.name, name), eq(schema.tribes.tag, tag)),
        excludeId ? ne(schema.tribes.id, excludeId) : undefined,
      ),
    )
    .limit(1);
  if (!row) return;
  if (row.name === name) throw AppError.conflict('Ce nom de tribu est déjà pris', 'TRIBE_NAME_TAKEN', { field: 'name' });
  if (row.tag === tag) throw AppError.conflict('Ce tag est déjà pris', 'TRIBE_TAG_TAKEN', { field: 'tag' });
}

/** POST /api/tribes — création (max 5 par utilisateur). */
export async function createTribe(userId: string, input: CreateTribeInput): Promise<TribeDetail> {
  await ensureUniqueIdentity(input.name, input.tag);

  const created = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.tribes)
    .where(eq(schema.tribes.createdById, userId));
  if ((created[0]?.count ?? 0) >= MAX_TRIBES_PER_USER) {
    throw AppError.badRequest(`Maximum ${MAX_TRIBES_PER_USER} tribus créées par utilisateur`, 'TRIBE_LIMIT_REACHED');
  }

  const [tribe] = await db
    .insert(schema.tribes)
    .values({
      name: input.name,
      tag: input.tag,
      topic: input.topic,
      desc: input.description ?? null,
      avatar: input.avatar ?? null,
      banner: input.banner ?? null,
      createdById: userId,
      memberCount: 1,
    })
    .returning();
  if (!tribe) throw AppError.badRequest('Échec de création de la tribu', 'TRIBE_CREATE_FAILED');

  await db.insert(schema.tribeMembers).values({ tribeId: tribe.id, userId, role: 'owner' });
  await redis.sadd(tribeMembersKey(tribe.id), userId);

  if (input.rules) {
    await db.insert(schema.tribeRules).values(input.rules.map((r, i) => ({ tribeId: tribe.id, number: i + 1, title: r.title, desc: r.description })));
  }

  return getTribeDetail(tribe.id, userId);
}

/** GET /api/tribes/:id — détail + stats. */
export async function getTribeDetail(tribeId: string, viewerId: string | null): Promise<TribeDetail> {
  const tribe = await findTribe(tribeId);

  const membersCount = await redis.scard(tribeMembersKey(tribeId));
  const memberCount = membersCount > 0 ? membersCount : tribe.memberCount;
  const visitorsDelta = Number((await redis.get(tribeVisitorsKey(tribeId))) ?? 0);

  const postsCountRow = await db.select({ count: sql<number>`count(*)::int` }).from(schema.posts).where(eq(schema.posts.tribeId, tribeId));
  const postsCount = postsCountRow[0]?.count ?? 0;

  const rules = await db.select().from(schema.tribeRules).where(eq(schema.tribeRules.tribeId, tribeId)).orderBy(schema.tribeRules.number);
  const moderators = await db
    .select({
      userId: schema.tribeMembers.userId,
      role: schema.tribeMembers.role,
      name: schema.users.name,
    })
    .from(schema.tribeMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.tribeMembers.userId))
    .where(and(eq(schema.tribeMembers.tribeId, tribeId), sql`${schema.tribeMembers.role} in ('owner', 'moderator')`));

  const membership = viewerId ? await isMember(tribeId, viewerId) : null;

  return {
    id: tribe.id,
    name: tribe.name,
    tag: tribe.tag ?? '',
    topic: tribe.topic,
    description: tribe.desc,
    avatar: tribe.avatar,
    banner: tribe.banner,
    glow: tribe.glow,
    membersCount: memberCount,
    visitorsCount: tribe.visitors + visitorsDelta,
    postsCount,
    role: membership?.role ?? null,
    joined: Boolean(membership),
    rules: rules.map((r) => ({ number: r.number, title: r.title, description: r.desc })),
    moderators: moderators.map((m) => ({ userId: m.userId, role: m.role, name: m.name })),
    createdAt: tribe.createdAt.toISOString(),
  };
}

/** PATCH /api/tribes/:id — admin uniquement. */
export async function patchTribe(tribeId: string, userId: string, patch: PatchTribeInput): Promise<TribeDetail> {
  const membership = await isMember(tribeId, userId);
  if (membership?.role !== 'owner') throw AppError.forbidden('Seul l’administrateur peut modifier la tribu', 'TRIBE_ADMIN_REQUIRED');

  if (patch.name) {
    const tribe = await findTribe(tribeId);
    await ensureUniqueIdentity(patch.name, tribe.tag ?? '', tribeId);
  }

  await db
    .update(schema.tribes)
    .set({
      name: patch.name,
      topic: patch.topic,
      desc: patch.description,
      avatar: patch.avatar,
      banner: patch.banner,
    })
    .where(eq(schema.tribes.id, tribeId));

  await redis.del(tribeCacheKey(tribeId));
  return getTribeDetail(tribeId, userId);
}

/** DELETE /api/tribes/:id — créateur ou superadmin. */
export async function deleteTribe(tribeId: string, userId: string): Promise<void> {
  const tribe = await findTribe(tribeId);
  if (tribe.createdById !== userId) {
    throw AppError.forbidden('Seul le créateur peut supprimer la tribu', 'TRIBE_DELETE_FORBIDDEN');
  }
  await db.delete(schema.tribes).where(eq(schema.tribes.id, tribeId));
  await redis.del(tribeCacheKey(tribeId), tribeMembersKey(tribeId), tribePostsKey(tribeId));
}

/** POST /api/tribes/:id/join. */
export async function joinTribe(tribeId: string, userId: string): Promise<{ joined: boolean; membersCount: number }> {
  const existing = await isMember(tribeId, userId);
  if (existing) return { joined: false, membersCount: await memberCount(tribeId) };

  await db.insert(schema.tribeMembers).values({ tribeId, userId, role: 'member' });
  await redis.sadd(tribeMembersKey(tribeId), userId);
  await db.update(schema.tribes).set({ memberCount: sql`member_count + 1` }).where(eq(schema.tribes.id, tribeId));
  return { joined: true, membersCount: await memberCount(tribeId) };
}

/** DELETE /api/tribes/:id/leave. */
export async function leaveTribe(tribeId: string, userId: string): Promise<{ left: boolean }> {
  const existing = await isMember(tribeId, userId);
  if (!existing) return { left: false };
  if (existing.role === 'owner') {
    throw AppError.badRequest('L’administrateur ne peut pas quitter sa propre tribu', 'TRIBE_OWNER_CANNOT_LEAVE');
  }
  await db.delete(schema.tribeMembers).where(and(eq(schema.tribeMembers.tribeId, tribeId), eq(schema.tribeMembers.userId, userId)));
  await redis.srem(tribeMembersKey(tribeId), userId);
  await db.update(schema.tribes).set({ memberCount: sql`GREATEST(member_count - 1, 0)` }).where(eq(schema.tribes.id, tribeId));
  return { left: true };
}

async function memberCount(tribeId: string): Promise<number> {
  const [tribe] = await db.select({ count: schema.tribes.memberCount }).from(schema.tribes).where(eq(schema.tribes.id, tribeId)).limit(1);
  return tribe?.count ?? 0;
}

/** GET /api/tribes/:id/posts — posts tribu (cursor), hydratés (auteur, likes, votes). */
export async function tribePosts(tribeId: string, viewerId: string, cursor: string | undefined, limit: number): Promise<{ posts: Awaited<ReturnType<typeof getPostsByIds>>; nextCursor: string | null }> {
  const query = db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.tribeId, tribeId), eq(schema.posts.status, 'published'), cursor ? lt(schema.posts.createdAt, new Date(cursor)) : undefined))
    .orderBy(desc(schema.posts.pinned), desc(schema.posts.createdAt))
    .limit(limit + 1);
  const rows = await query;
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;
  const posts = await getPostsByIds(page.map((p) => p.id), viewerId);
  return { posts, nextCursor };
}

/** POST /api/tribu/posts/:id/upvote — toggle up/down. */
export async function votePost(postId: string, userId: string, value: 1 | -1): Promise<{ myVote: number; score: number }> {
  const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');

  const [existing] = await db.select().from(schema.postVotes).where(and(eq(schema.postVotes.postId, postId), eq(schema.postVotes.userId, userId))).limit(1);

  if (existing) {
    if (existing.value === value) {
      await db.delete(schema.postVotes).where(and(eq(schema.postVotes.postId, postId), eq(schema.postVotes.userId, userId)));
    } else {
      await db.update(schema.postVotes).set({ value, updatedAt: new Date() }).where(and(eq(schema.postVotes.postId, postId), eq(schema.postVotes.userId, userId)));
    }
  } else {
    await db.insert(schema.postVotes).values({ postId, userId, value });
  }

  const score = await recomputeScore(postId);
  return { myVote: existing && existing.value === value ? 0 : value, score };
}

async function recomputeScore(postId: string): Promise<number> {
  const [row] = await db.select({ total: sql<number>`COALESCE(SUM(value),0)::int` }).from(schema.postVotes).where(eq(schema.postVotes.postId, postId));
  const score = row?.total ?? 0;
  await db.update(schema.posts).set({ score, updatedAt: new Date() }).where(eq(schema.posts.id, postId));
  return score;
}

/** POST /api/tribes/:id/posts/:postId/pin — moderator+. */
export async function pinTribePost(tribeId: string, postId: string, userId: string, pinned: boolean): Promise<{ pinned: boolean }> {
  const membership = await isMember(tribeId, userId);
  if (!hasModRole(membership?.role)) throw AppError.forbidden('Seul un modérateur peut épingler', 'TRIBE_MODERATOR_REQUIRED');

  const [post] = await db.select().from(schema.posts).where(and(eq(schema.posts.id, postId), eq(schema.posts.tribeId, tribeId))).limit(1);
  if (!post) throw AppError.notFound('Post introuvable dans cette tribu', 'POST_NOT_FOUND');

  await db.update(schema.posts).set({ pinned, updatedAt: new Date() }).where(eq(schema.posts.id, postId));
  return { pinned };
}

// ── Modérateurs ─────────────────────────────────────────────

/** POST /api/tribes/:id/moderators — promotion d'un membre (owner). */
export async function promoteModerator(tribeId: string, ownerId: string, targetUserId: string): Promise<{ userId: string; role: string }> {
  await requireOwner(tribeId, ownerId);

  const membership = await isMember(tribeId, targetUserId);
  if (!membership) throw AppError.badRequest('Cet utilisateur n’est pas membre de la tribu', 'NOT_A_MEMBER');
  if (membership.role === 'owner') throw AppError.badRequest('L’owner est déjà administrateur', 'OWNER_NOT_PROMOTABLE');

  await db
    .update(schema.tribeMembers)
    .set({ role: 'moderator' })
    .where(and(eq(schema.tribeMembers.tribeId, tribeId), eq(schema.tribeMembers.userId, targetUserId)));

  await recordAudit(ownerId, 'tribe.promote_moderator', { tribeId, targetUserId });
  return { userId: targetUserId, role: 'moderator' };
}

/** DELETE /api/tribes/:id/moderators/:userId — rétrogradation (owner). */
export async function demoteModerator(tribeId: string, ownerId: string, targetUserId: string): Promise<{ userId: string; role: string }> {
  await requireOwner(tribeId, ownerId);

  const membership = await isMember(tribeId, targetUserId);
  if (!membership) throw AppError.badRequest('Cet utilisateur n’est pas membre de la tribu', 'NOT_A_MEMBER');
  if (membership.role !== 'moderator') throw AppError.badRequest('Cet utilisateur n’est pas modérateur', 'NOT_A_MODERATOR');

  await db
    .update(schema.tribeMembers)
    .set({ role: 'member' })
    .where(and(eq(schema.tribeMembers.tribeId, tribeId), eq(schema.tribeMembers.userId, targetUserId)));

  await recordAudit(ownerId, 'tribe.demote_moderator', { tribeId, targetUserId });
  return { userId: targetUserId, role: 'member' };
}

async function requireOwner(tribeId: string, userId: string): Promise<void> {
  const membership = await isMember(tribeId, userId);
  if (membership?.role !== 'owner') throw AppError.forbidden('Seul l’administrateur de la tribu peut effectuer cette action', 'TRIBE_OWNER_REQUIRED');
}

// ── Règles ──────────────────────────────────────────────────

/** POST /api/tribes/:id/rules — ajout d'une règle (owner). */
export async function addTribeRule(tribeId: string, userId: string, input: CreateRuleInput): Promise<{ id: string; number: number; title: string; description: string | null }> {
  await requireOwner(tribeId, userId);

  const [max] = await db
    .select({ max: sql<number>`COALESCE(MAX(number),0)::int` })
    .from(schema.tribeRules)
    .where(eq(schema.tribeRules.tribeId, tribeId));
  const number = (max?.max ?? 0) + 1;

  const [rule] = await db
    .insert(schema.tribeRules)
    .values({ tribeId, number, title: input.title, desc: input.description ?? null })
    .returning();
  if (!rule) throw AppError.badRequest('Échec d’ajout de la règle', 'RULE_CREATE_FAILED');

  await recordAudit(userId, 'tribe.add_rule', { tribeId, ruleId: rule.id });
  return { id: rule.id, number: rule.number, title: rule.title, description: rule.desc };
}

/** PATCH /api/tribes/:id/rules/:ruleId — modification (owner). */
export async function updateTribeRule(tribeId: string, userId: string, ruleId: string, input: PatchRuleInput): Promise<{ number: number; title: string; description: string | null }> {
  await requireOwner(tribeId, userId);

  const [rule] = await db
    .update(schema.tribeRules)
    .set({
      title: input.title,
      desc: input.description,
    })
    .where(and(eq(schema.tribeRules.id, ruleId), eq(schema.tribeRules.tribeId, tribeId)))
    .returning();
  if (!rule) throw AppError.notFound('Règle introuvable', 'RULE_NOT_FOUND');

  await recordAudit(userId, 'tribe.update_rule', { tribeId, ruleId });
  return { number: rule.number, title: rule.title, description: rule.desc };
}

/** DELETE /api/tribes/:id/rules/:ruleId — suppression (owner) + renumérotation. */
export async function deleteTribeRule(tribeId: string, userId: string, ruleId: string): Promise<{ success: true }> {
  await requireOwner(tribeId, userId);

  const deleted = await db
    .delete(schema.tribeRules)
    .where(and(eq(schema.tribeRules.id, ruleId), eq(schema.tribeRules.tribeId, tribeId)))
    .returning({ id: schema.tribeRules.id });
  if (deleted.length === 0) throw AppError.notFound('Règle introuvable', 'RULE_NOT_FOUND');

  // Renumérotation séquentielle des règles restantes
  const remaining = await db.select().from(schema.tribeRules).where(eq(schema.tribeRules.tribeId, tribeId)).orderBy(schema.tribeRules.number);
  for (let i = 0; i < remaining.length; i++) {
    const rule = remaining[i];
    if (rule && rule.number !== i + 1) {
      await db.update(schema.tribeRules).set({ number: i + 1 }).where(eq(schema.tribeRules.id, rule.id));
    }
  }

  await recordAudit(userId, 'tribe.delete_rule', { tribeId, ruleId });
  return { success: true };
}

// ── Signalements ────────────────────────────────────────────

/** POST /api/tribes/:id/report — signaler une tribu. */
export async function reportTribe(tribeId: string, reporterId: string, reason: string): Promise<{ reported: boolean }> {
  const tribe = await findTribe(tribeId);
  if (tribe.createdById === reporterId) {
    throw AppError.badRequest('Impossible de signaler sa propre tribu', 'SELF_REPORT_FORBIDDEN');
  }

  await createReport(reporterId, 'tribe', tribeId, reason);
  return { reported: true };
}

/** POST /api/tribes/:id/posts/:postId/report — signaler un post de tribu. */
export async function reportTribePost(tribeId: string, postId: string, reporterId: string, reason: string): Promise<{ reported: boolean }> {
  const [post] = await db
    .select({ id: schema.posts.id, authorId: schema.posts.authorId })
    .from(schema.posts)
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.tribeId, tribeId)))
    .limit(1);
  if (!post) throw AppError.notFound('Post introuvable dans cette tribu', 'POST_NOT_FOUND');
  if (post.authorId === reporterId) {
    throw AppError.badRequest('Impossible de signaler son propre post', 'SELF_REPORT_FORBIDDEN');
  }

  await createReport(reporterId, 'post', postId, reason);
  return { reported: true };
}

async function createReport(reporterId: string, targetType: string, targetId: string, reason: string): Promise<void> {
  const [existing] = await db
    .select({ id: schema.reports.id })
    .from(schema.reports)
    .where(
      and(
        eq(schema.reports.reporterId, reporterId),
        eq(schema.reports.targetType, targetType),
        eq(schema.reports.targetId, targetId),
        eq(schema.reports.status, 'open'),
      ),
    )
    .limit(1);
  if (existing) throw AppError.conflict('Vous avez déjà signalé cette ressource', 'ALREADY_REPORTED');

  await db.insert(schema.reports).values({ reporterId, targetType, targetId, reason });
}

/** GET /api/tribes/:id/reports — liste des signalements ouverts (moderator+). */
export async function listTribeReports(
  tribeId: string,
  userId: string,
  cursor: string | undefined,
  limit: number,
): Promise<{ reports: Array<Record<string, unknown>>; nextCursor: string | null }> {
  const membership = await isMember(tribeId, userId);
  if (!hasModRole(membership?.role)) throw AppError.forbidden('Seul un modérateur peut voir les signalements', 'TRIBE_MODERATOR_REQUIRED');

  const tribePostIds = db.select({ id: schema.posts.id }).from(schema.posts).where(eq(schema.posts.tribeId, tribeId));

  const query = db
    .select({
      id: schema.reports.id,
      targetType: schema.reports.targetType,
      targetId: schema.reports.targetId,
      reason: schema.reports.reason,
      status: schema.reports.status,
      createdAt: schema.reports.createdAt,
      reporterName: schema.users.name,
    })
    .from(schema.reports)
    .innerJoin(schema.users, eq(schema.users.id, schema.reports.reporterId))
    .where(
      and(
        eq(schema.reports.status, 'open'),
        or(
          and(eq(schema.reports.targetType, 'tribe'), eq(schema.reports.targetId, tribeId)),
          and(eq(schema.reports.targetType, 'post'), inArray(schema.reports.targetId, tribePostIds)),
        ),
        cursor ? lt(schema.reports.createdAt, new Date(cursor)) : undefined,
      ),
    )
    .orderBy(desc(schema.reports.createdAt))
    .limit(limit + 1);

  const rows = await query;
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;
  return {
    reports: page.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    nextCursor,
  };
}
