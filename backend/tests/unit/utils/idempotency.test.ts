import { beforeEach, describe, expect, it, vi } from 'vitest';

// Redis simulé en mémoire : on vérifie la logique d'idempotence, pas ioredis.
const store = new Map<string, string>();
const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));
vi.mock('../../../src/infrastructure/redis', () => ({ redis: redisMock }));

import { idempotencyKeyFrom, withIdempotency } from '../../../src/shared/utils/idempotency';
import { AppError } from '../../../src/shared/utils/AppError';

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  redisMock.get.mockImplementation(async (k: string) => store.get(k) ?? null);
  redisMock.set.mockImplementation(async (k: string, v: string, ...args: unknown[]) => {
    if (args.includes('NX') && store.has(k)) return null;
    store.set(k, v);
    return 'OK';
  });
  redisMock.del.mockImplementation(async (k: string) => (store.delete(k) ? 1 : 0));
});

describe('withIdempotency', () => {
  it('exécute fn sans toucher à Redis quand aucune clé n’est fournie', async () => {
    const fn = vi.fn().mockResolvedValue({ ok: 1 });
    await expect(withIdempotency('post', undefined, fn)).resolves.toEqual({ ok: 1 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(redisMock.get).not.toHaveBeenCalled();
  });

  it('met le résultat en cache 24h et libère le verrou', async () => {
    const fn = vi.fn().mockResolvedValue({ id: 'p1' });
    await withIdempotency('post', 'k1', fn);
    expect(JSON.parse(store.get('idem:post:k1')!)).toEqual({ id: 'p1' });
    expect(store.has('idem:post:k1:lock')).toBe(false);
    expect(redisMock.set).toHaveBeenCalledWith('idem:post:k1', JSON.stringify({ id: 'p1' }), 'EX', 24 * 60 * 60);
  });

  it('un doublon renvoie le résultat en cache sans ré-exécuter fn', async () => {
    const fn = vi.fn().mockResolvedValue({ n: 1 });
    const first = await withIdempotency('like', 'dup', fn);
    const second = await withIdempotency('like', 'dup', fn);
    expect(second).toEqual(first);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('isole les clés par scope', async () => {
    const fn = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');
    expect(await withIdempotency('s1', 'same', fn)).toBe('a');
    expect(await withIdempotency('s2', 'same', fn)).toBe('b');
  });

  it('libère le verrou et ne met rien en cache quand fn échoue', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(withIdempotency('post', 'bad', fn)).rejects.toThrow('boom');
    expect(store.has('idem:post:bad')).toBe(false);
    expect(store.has('idem:post:bad:lock')).toBe(false);
  });

  it('renvoie 409 quand une requête concurrente tient le verrou sans résultat', async () => {
    vi.useFakeTimers();
    try {
      store.set('idem:post:busy:lock', '1');
      const p = withIdempotency('post', 'busy', vi.fn());
      const assertion = expect(p).rejects.toSatisfy(
        (e: unknown) => e instanceof AppError && e.status === 409 && e.code === 'IDEMPOTENCY_IN_FLIGHT',
      );
      await vi.advanceTimersByTimeAsync(500);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('renvoie le résultat publié par la requête concurrente pendant l’attente', async () => {
    vi.useFakeTimers();
    try {
      store.set('idem:post:race:lock', '1');
      const fn = vi.fn();
      const p = withIdempotency('post', 'race', fn);
      store.set('idem:post:race', JSON.stringify({ id: 'fini' }));
      await vi.advanceTimersByTimeAsync(500);
      await expect(p).resolves.toEqual({ id: 'fini' });
      expect(fn).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('idempotencyKeyFrom', () => {
  const ctx = (value: string | undefined) => ({ req: { header: (n: string) => (n === 'idempotency-key' ? value : undefined) } });

  it('renvoie undefined sans en-tête', () => {
    expect(idempotencyKeyFrom(ctx(undefined))).toBeUndefined();
  });

  it('renvoie la clé telle quelle', () => {
    expect(idempotencyKeyFrom(ctx('abc-123'))).toBe('abc-123');
  });

  it('tronque les clés à 128 caractères', () => {
    expect(idempotencyKeyFrom(ctx('x'.repeat(300)))).toHaveLength(128);
  });
});
