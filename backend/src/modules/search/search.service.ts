import { and, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import { readablePostCondition } from '../tribes/tribes.access';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';

const RATE_LIMIT = 30; // requêtes / min / user
const rlKey = (userId: string) => `rl:search:${userId}`;

export interface SearchUserDto {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  country: string | null;
}

export interface SearchPostDto {
  id: string;
  title: string | null;
  authorName: string;
  type: string;
  tags: string[];
  createdAt: string;
}

export interface SearchTribeDto {
  id: string;
  name: string;
  tag: string | null;
  description: string | null;
  avatar: string | null;
  memberCount: number;
}

export interface SearchResults {
  users: SearchUserDto[];
  posts: SearchPostDto[];
  tribes: SearchTribeDto[];
}

/** Échappe les jokers % et _ pour un LIKE/ILIKE littéral. */
function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** GET /api/search — recherche multi-entités (rate limit 30/min). */
export async function search(
  userId: string,
  q: string,
  type: 'users' | 'posts' | 'tribes' | 'all',
  limit: number,
  offset: number,
): Promise<SearchResults> {
  const count = await redis.incr(rlKey(userId));
  if (count === 1) await redis.expire(rlKey(userId), 60);
  if (count > RATE_LIMIT) throw AppError.tooMany('Limite de recherche atteinte (30/min)', 'SEARCH_RATE_LIMITED');

  const blocked = await blockedIds(userId);
  const pattern = `%${escapeLike(q)}%`;

  const results: SearchResults = { users: [], posts: [], tribes: [] };

  if (type === 'users' || type === 'all') {
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        username: schema.users.username,
        avatar: schema.users.avatar,
        bio: schema.users.bio,
        country: schema.users.country,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.profileCompleted, true),
          ne(schema.users.id, userId),
          or(ilike(schema.users.name, pattern), ilike(schema.users.username, pattern)),
        ),
      )
      .orderBy(schema.users.name)
      .limit(limit)
      .offset(offset);
    results.users = users.filter((u) => !blocked.includes(u.id));
  }

  if (type === 'posts' || type === 'all') {
    const posts = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        authorId: schema.posts.authorId,
        type: schema.posts.type,
        tags: schema.posts.tags,
        createdAt: schema.posts.createdAt,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.status, 'published'),
          readablePostCondition(userId),
          or(ilike(schema.posts.title, pattern), ilike(schema.posts.body, pattern)),
        ),
      )
      .orderBy(desc(schema.posts.createdAt))
      .limit(limit)
      .offset(offset);

    const authorIds = [...new Set(posts.map((p) => p.authorId).filter((id) => !blocked.includes(id)))];
    const authors = authorIds.length > 0
      ? await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, authorIds))
      : [];
    const authorName = new Map(authors.map((a) => [a.id, a.name]));

    results.posts = posts
      .filter((p) => !blocked.includes(p.authorId))
      .map((p) => ({
        id: p.id,
        title: p.title,
        authorName: authorName.get(p.authorId) ?? '',
        type: p.type,
        tags: p.tags ?? [],
        createdAt: p.createdAt.toISOString(),
      }));
  }

  if (type === 'tribes' || type === 'all') {
    const tribes = await db
      .select({
        id: schema.tribes.id,
        name: schema.tribes.name,
        tag: schema.tribes.tag,
        description: schema.tribes.desc,
        avatar: schema.tribes.avatar,
        memberCount: schema.tribes.memberCount,
      })
      .from(schema.tribes)
      .where(and(
        // Une tribu privée n'apparaît pas dans la recherche, sauf pour ses membres.
        sql`(${schema.tribes.visibility} = 'public' OR EXISTS (SELECT 1 FROM tribe_members m WHERE m.tribe_id = ${schema.tribes.id} AND m.user_id = ${userId}))`,
        or(ilike(schema.tribes.name, pattern), ilike(schema.tribes.tag, pattern), ilike(schema.tribes.desc, pattern)),
      ))
      .orderBy(desc(schema.tribes.memberCount))
      .limit(limit)
      .offset(offset);
    results.tribes = tribes;
  }

  return results;
}

async function blockedIds(userId: string): Promise<string[]> {
  const rows = await db.select({ blockedId: schema.blocks.blockedId }).from(schema.blocks).where(eq(schema.blocks.blockerId, userId));
  return rows.map((r) => r.blockedId);
}
