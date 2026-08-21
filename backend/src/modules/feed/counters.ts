import { sql } from 'drizzle-orm';
import { redis } from '../../infrastructure/redis';
import { db, schema } from '../../infrastructure/database';
import { eq } from 'drizzle-orm';

export type CounterName = 'likes' | 'comments' | 'views' | 'saves' | 'shares';

const deltaKey = (postId: string, counter: CounterName) => `post:${postId}:d:${counter}`;
export const dirtySetKey = 'counters:dirty';

const ALL_COUNTERS: CounterName[] = ['likes', 'comments', 'views', 'saves', 'shares'];

/** Incrémente un compteur en temps réel (Redis) et marque le post à flusher. */
export async function incrementCounter(postId: string, counter: CounterName): Promise<number> {
  const value = await redis.incr(deltaKey(postId, counter));
  await redis.zadd(dirtySetKey, Date.now(), postId);
  return value;
}

/** Décrémente (unlike / unsave). */
export async function decrementCounter(postId: string, counter: CounterName): Promise<number> {
  const value = await redis.decr(deltaKey(postId, counter));
  await redis.zadd(dirtySetKey, Date.now(), postId);
  return value;
}

/** Deltas en attente de flush pour un post. */
export async function getCounterDeltas(postId: string): Promise<Record<CounterName, number>> {
  const values = await redis.mget(ALL_COUNTERS.map((c) => deltaKey(postId, c)));
  return Object.fromEntries(ALL_COUNTERS.map((c, i) => [c, Number(values[i] ?? 0)])) as Record<CounterName, number>;
}

/** Retourne les postIds marqués comme sales (deltas non flusher). */
export async function getDirtyPostIds(limit = 1000): Promise<string[]> {
  return redis.zrange(dirtySetKey, 0, limit - 1);
}

/**
 * Flush batch : applique les deltas Redis en UN SEUL UPDATE par post.
 * Utilisé par le worker BullMQ `counters.flush` (toutes les 5 min).
 */
export async function flushCounters(postIds: string[]): Promise<number> {
  let flushed = 0;
  for (const postId of postIds) {
    const deltas = await getCounterDeltas(postId);
    const hasDelta = Object.values(deltas).some((v) => v !== 0);
    if (!hasDelta) {
      await redis.zrem(dirtySetKey, postId);
      continue;
    }

    const set: Partial<Record<CounterName, ReturnType<typeof sql>>> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };
    for (const c of ALL_COUNTERS) {
      if (deltas[c] !== 0) {
        set[c] = sql`${schema.posts[c]} + ${deltas[c]}`;
      }
    }

    await db.update(schema.posts).set(set).where(eq(schema.posts.id, postId));

    await redis.del(...ALL_COUNTERS.map((c) => deltaKey(postId, c)));
    await redis.zrem(dirtySetKey, postId);
    flushed++;
  }
  return flushed;
}

const tribeVisitorsDeltaKey = (tribeId: string) => `tribe:${tribeId}:visitors`;
export const tribeVisitorsDirtyKey = 'tribes:visitors:dirty';

/** Flush des visiteurs de tribus (deltas Redis -> colonnes visitors). */
export async function flushTribeVisitors(): Promise<number> {
  const tribeIds = await redis.zrange(tribeVisitorsDirtyKey, 0, 999);
  if (tribeIds.length === 0) return 0;

  let flushed = 0;
  for (const tribeId of tribeIds) {
    const delta = Number((await redis.get(tribeVisitorsDeltaKey(tribeId))) ?? 0);
    if (delta === 0) {
      await redis.zrem(tribeVisitorsDirtyKey, tribeId);
      continue;
    }
    await db
      .update(schema.tribes)
      .set({ visitors: sql`${schema.tribes.visitors} + ${delta}` })
      .where(eq(schema.tribes.id, tribeId));
    await redis.del(tribeVisitorsDeltaKey(tribeId));
    await redis.zrem(tribeVisitorsDirtyKey, tribeId);
    flushed++;
  }
  return flushed;
}
