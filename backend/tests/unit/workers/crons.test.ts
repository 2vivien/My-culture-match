import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chain } from '../helpers/drizzle-fake';

vi.mock('bullmq', async () => (await import('../helpers/bullmq-fake')).bullmqFake);
vi.mock('../../../src/config/env', () => ({ env: { REDIS_URL: 'redis://test' } }));

const h = vi.hoisted(() => ({
  logger: { info: vi.fn(), error: vi.fn() },
  redis: { scan: vi.fn(), ttl: vi.fn(), del: vi.fn() },
  db: { delete: vi.fn(), select: vi.fn() },
  getSuggestions: vi.fn(),
  revealDue: vi.fn(),
}));
vi.mock('../../../src/middleware/logger', () => ({ logger: h.logger }));
vi.mock('../../../src/infrastructure/redis', () => ({ redis: h.redis }));
vi.mock('../../../src/infrastructure/database', () => ({
  db: h.db,
  schema: {
    sessions: { id: 'sessions.id', expiresAt: 'sessions.expiresAt' },
    users: { id: 'users.id', profileCompleted: 'users.profileCompleted' },
  },
}));
vi.mock('../../../src/modules/connections/connections.service', () => ({ getSuggestions: h.getSuggestions }));
vi.mock('../../../src/modules/temporal-messages/temporal-messages.service', () => ({ revealDueTemporalMessages: h.revealDue }));

import {
  cleanupExpiredSessions, cleanupPresenceKeys, closeCronQueues, generateDailySuggestions, revealTemporalMessages,
  startCronWorkers,
} from '../../../src/modules/workers/crons';
import { fakeQueues, fakeWorkers } from '../helpers/bullmq-fake';

beforeEach(() => vi.clearAllMocks());

describe('cleanupPresenceKeys', () => {
  it('supprime uniquement les clés de présence sans TTL, sur toutes les pages du curseur', async () => {
    h.redis.scan
      .mockResolvedValueOnce(['7', ['presence:a', 'presence:b']])
      .mockResolvedValueOnce(['0', ['presence:c']]);
    h.redis.ttl.mockImplementation(async (k: string) => (k === 'presence:b' ? 120 : -1));
    await expect(cleanupPresenceKeys()).resolves.toBe(2);
    expect(h.redis.scan).toHaveBeenNthCalledWith(1, '0', 'MATCH', 'presence:*', 'COUNT', 100);
    expect(h.redis.scan).toHaveBeenNthCalledWith(2, '7', 'MATCH', 'presence:*', 'COUNT', 100);
    expect(h.redis.del.mock.calls.map((c) => c[0])).toEqual(['presence:a', 'presence:c']);
  });

  it('renvoie 0 quand aucune clé n’existe', async () => {
    h.redis.scan.mockResolvedValue(['0', []]);
    await expect(cleanupPresenceKeys()).resolves.toBe(0);
    expect(h.redis.del).not.toHaveBeenCalled();
  });
});

describe('cleanupExpiredSessions', () => {
  it('renvoie le nombre de sessions expirées purgées', async () => {
    h.db.delete.mockReturnValue(chain([{ id: 's1' }, { id: 's2' }]));
    await expect(cleanupExpiredSessions()).resolves.toBe(2);
  });
});

describe('generateDailySuggestions', () => {
  it('additionne les suggestions des profils complets et ignore ceux qui échouent', async () => {
    h.db.select.mockReturnValue(chain([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]));
    h.getSuggestions
      .mockResolvedValueOnce({ suggestions: [1, 2, 3] })
      .mockRejectedValueOnce(new Error('profil incomplet'))
      .mockResolvedValueOnce({ suggestions: [1] });
    await expect(generateDailySuggestions(50)).resolves.toBe(4);
    expect(h.getSuggestions.mock.calls.map((c) => c[0])).toEqual(['u1', 'u2', 'u3']);
  });

  it('applique la limite demandée', async () => {
    const query = chain([]);
    h.db.select.mockReturnValue(query);
    await generateDailySuggestions(7);
    expect(query.args.limit).toEqual([7]);
  });
});

describe('revealTemporalMessages', () => {
  it('révèle jusqu’à 100 messages par passage', async () => {
    h.revealDue.mockResolvedValue(3);
    await expect(revealTemporalMessages()).resolves.toBe(3);
    expect(h.revealDue).toHaveBeenCalledWith(100);
  });
});

describe('planification', () => {
  it('démarre un worker par tâche, planifie chaque cron une seule fois, et journalise les échecs', async () => {
    startCronWorkers();
    startCronWorkers(); // idempotent
    expect(fakeWorkers.map((w) => w.name).sort()).toEqual(['presence.cleanup', 'session.cleanup', 'temporal-message.reveal', 'user.suggestions']);

    const reveal = fakeQueues.find((q) => q.name === 'temporal-message.reveal')!;
    expect(reveal.add).toHaveBeenCalledWith('cron', {}, { repeat: { pattern: '* * * * *' }, jobId: 'cron-temporal-message.reveal' });
    const sessions = fakeQueues.find((q) => q.name === 'session.cleanup')!;
    expect(sessions.add).toHaveBeenCalledWith('cron', {}, expect.objectContaining({ repeat: { pattern: '0 4 * * *' } }));

    h.revealDue.mockResolvedValue(5);
    await fakeWorkers.find((w) => w.name === 'temporal-message.reveal')!.processor({});
    expect(h.logger.info).toHaveBeenCalledWith({ queue: 'temporal-message.reveal', result: 5 }, 'cron exécuté');

    fakeWorkers[0]!.handlers.failed!({ id: 'j9' }, new Error('boom'));
    expect(h.logger.error).toHaveBeenCalledWith({ jobId: 'j9', err: { message: 'boom' } }, expect.stringContaining('échoué'));
  });

  it('ferme les workers et les files sans lever d’erreur même si une fermeture échoue', async () => {
    startCronWorkers();
    fakeWorkers[0]!.close.mockRejectedValueOnce(new Error('déjà fermé'));
    await expect(closeCronQueues()).resolves.toBeUndefined();
    expect(fakeWorkers.every((w) => w.close.mock.calls.length > 0)).toBe(true);
    expect(fakeQueues.filter((q) => ['presence.cleanup', 'session.cleanup', 'user.suggestions', 'temporal-message.reveal'].includes(q.name)).every((q) => q.close.mock.calls.length > 0)).toBe(true);
  });
});
