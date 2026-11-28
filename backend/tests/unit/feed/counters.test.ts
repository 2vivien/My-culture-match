import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const redis = {
    incr: vi.fn(), decr: vi.fn(), zadd: vi.fn(), mget: vi.fn(), zrange: vi.fn(),
    zrem: vi.fn(), del: vi.fn(), get: vi.fn(),
  };
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return { redis, where, set, update };
});
vi.mock('../../../src/infrastructure/redis', () => ({ redis: h.redis }));
vi.mock('../../../src/infrastructure/database', () => ({
  db: { update: h.update },
  schema: {
    posts: { likes: 'posts.likes', comments: 'posts.comments', views: 'posts.views', saves: 'posts.saves', shares: 'posts.shares', id: 'posts.id' },
    tribes: { visitors: 'tribes.visitors', id: 'tribes.id' },
  },
}));

import {
  decrementCounter, dirtySetKey, flushCounters, flushTribeVisitors, getCounterDeltas,
  getDirtyPostIds, incrementCounter, tribeVisitorsDirtyKey,
} from '../../../src/modules/feed/counters';

beforeEach(() => {
  vi.clearAllMocks();
  h.where.mockResolvedValue(undefined);
});

describe('compteurs temps réel', () => {
  it('incrémente le delta Redis et marque le post comme sale', async () => {
    h.redis.incr.mockResolvedValue(3);
    await expect(incrementCounter('p1', 'likes')).resolves.toBe(3);
    expect(h.redis.incr).toHaveBeenCalledWith('post:p1:d:likes');
    expect(h.redis.zadd).toHaveBeenCalledWith(dirtySetKey, expect.any(Number), 'p1');
  });

  it('décrémente (unlike) et marque le post comme sale', async () => {
    h.redis.decr.mockResolvedValue(-1);
    await expect(decrementCounter('p1', 'saves')).resolves.toBe(-1);
    expect(h.redis.decr).toHaveBeenCalledWith('post:p1:d:saves');
    expect(h.redis.zadd).toHaveBeenCalledWith(dirtySetKey, expect.any(Number), 'p1');
  });

  it('lit les cinq deltas, les valeurs absentes valent 0', async () => {
    h.redis.mget.mockResolvedValue(['2', null, '-1', null, '5']);
    await expect(getCounterDeltas('p1')).resolves.toEqual({ likes: 2, comments: 0, views: -1, saves: 0, shares: 5 });
    expect(h.redis.mget).toHaveBeenCalledWith([
      'post:p1:d:likes', 'post:p1:d:comments', 'post:p1:d:views', 'post:p1:d:saves', 'post:p1:d:shares',
    ]);
  });

  it('liste les posts sales avec la limite demandée', async () => {
    h.redis.zrange.mockResolvedValue(['a', 'b']);
    await expect(getDirtyPostIds(2)).resolves.toEqual(['a', 'b']);
    expect(h.redis.zrange).toHaveBeenCalledWith(dirtySetKey, 0, 1);
  });
});

describe('flushCounters', () => {
  it('retire un post sans delta de l’ensemble sale sans écrire en base', async () => {
    h.redis.mget.mockResolvedValue([null, null, null, null, null]);
    await expect(flushCounters(['p1'])).resolves.toBe(0);
    expect(h.update).not.toHaveBeenCalled();
    expect(h.redis.zrem).toHaveBeenCalledWith(dirtySetKey, 'p1');
  });

  it('applique un seul UPDATE par post avec uniquement les compteurs modifiés, puis nettoie Redis', async () => {
    h.redis.mget.mockResolvedValue(['4', null, '0', '-2', null]);
    await expect(flushCounters(['p1'])).resolves.toBe(1);
    expect(h.update).toHaveBeenCalledTimes(1);
    const payload = (h.set.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(Object.keys(payload).sort()).toEqual(['likes', 'saves', 'updatedAt']);
    expect(h.redis.del).toHaveBeenCalledWith(
      'post:p1:d:likes', 'post:p1:d:comments', 'post:p1:d:views', 'post:p1:d:saves', 'post:p1:d:shares',
    );
    expect(h.redis.zrem).toHaveBeenCalledWith(dirtySetKey, 'p1');
  });

  it('compte uniquement les posts réellement flushés', async () => {
    h.redis.mget
      .mockResolvedValueOnce(['1', null, null, null, null])
      .mockResolvedValueOnce([null, null, null, null, null])
      .mockResolvedValueOnce([null, '2', null, null, null]);
    await expect(flushCounters(['a', 'b', 'c'])).resolves.toBe(2);
  });
});

describe('flushTribeVisitors', () => {
  it('ne fait rien quand aucune tribu n’est sale', async () => {
    h.redis.zrange.mockResolvedValue([]);
    await expect(flushTribeVisitors()).resolves.toBe(0);
    expect(h.update).not.toHaveBeenCalled();
  });

  it('applique les deltas non nuls et ignore les deltas nuls', async () => {
    h.redis.zrange.mockResolvedValue(['t1', 't2']);
    h.redis.get.mockResolvedValueOnce('7').mockResolvedValueOnce('0');
    await expect(flushTribeVisitors()).resolves.toBe(1);
    expect(h.update).toHaveBeenCalledTimes(1);
    expect(h.redis.del).toHaveBeenCalledWith('tribe:t1:visitors');
    expect(h.redis.zrem).toHaveBeenCalledWith(tribeVisitorsDirtyKey, 't1');
    expect(h.redis.zrem).toHaveBeenCalledWith(tribeVisitorsDirtyKey, 't2');
  });
});
