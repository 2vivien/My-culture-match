import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chain } from '../helpers/drizzle-fake';

vi.mock('bullmq', async () => (await import('../helpers/bullmq-fake')).bullmqFake);
vi.mock('../../../src/config/env', () => ({
  env: {
    REDIS_URL: 'redis://test', BREVO_API_KEY: 'brevo-test-key', BREVO_SENDER_NAME: 'MCM', BREVO_SENDER_EMAIL: 'no-reply@example.test',
  },
}));

const h = vi.hoisted(() => ({
  logger: { info: vi.fn(), error: vi.fn() },
  select: vi.fn(),
  addDocuments: vi.fn(),
  flushCounters: vi.fn(),
  getDirtyPostIds: vi.fn(),
  flushTribeVisitors: vi.fn(),
}));
vi.mock('../../../src/middleware/logger', () => ({ logger: h.logger }));
vi.mock('../../../src/infrastructure/database', () => ({
  db: { select: h.select },
  schema: { posts: { id: 'p.id', authorId: 'p.authorId', title: 'p.title', body: 'p.body', tags: 'p.tags', status: 'p.status', createdAt: 'p.createdAt' } },
}));
vi.mock('../../../src/infrastructure/meilisearch', () => ({ meilisearch: { index: () => ({ addDocuments: h.addDocuments }) } }));
vi.mock('../../../src/modules/feed/counters', () => ({
  flushCounters: h.flushCounters, getDirtyPostIds: h.getDirtyPostIds, flushTribeVisitors: h.flushTribeVisitors,
}));

import { closeEmailQueue, emailQueue, enqueueEmail, startEmailWorker } from '../../../src/modules/email/email.queue';
import { closeSearchQueue, enqueueSearchIndex, processIndexPost, searchQueue, startSearchWorker } from '../../../src/modules/search/search.queue';
import { closeCountersFlushQueue, startCountersFlushWorker } from '../../../src/modules/feed/counters.queue';
import { fakeWorkers, queueNamed, workerNamed } from '../helpers/bullmq-fake';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('email.queue', () => {
  it('configure 3 tentatives avec backoff exponentiel', () => {
    expect((emailQueue as unknown as { opts: { defaultJobOptions: unknown } }).opts.defaultJobOptions).toMatchObject({
      attempts: 3, backoff: { type: 'exponential', delay: 5000 },
    });
  });

  it('enfile un email', async () => {
    await enqueueEmail({ to: 'a@b.fr', subject: 'S', html: '<p>x</p>' });
    expect((emailQueue as unknown as { add: ReturnType<typeof vi.fn> }).add).toHaveBeenCalledWith('send', { to: 'a@b.fr', subject: 'S', html: '<p>x</p>' });
  });

  it('le worker envoie via l’API Brevo avec la clé et l’expéditeur configurés', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const w = startEmailWorker();
    expect(startEmailWorker()).toBe(w);
    const fake = workerNamed('email')!;
    expect(fake.opts).toMatchObject({ concurrency: 5 });
    await fake.processor({ id: 'j1', data: { to: 'a@b.fr', subject: 'Bienvenue', html: '<b>hi</b>' } });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((init as { headers: Record<string, string> }).headers['api-key']).toBe('brevo-test-key');
    expect(JSON.parse((init as { body: string }).body)).toEqual({
      sender: { name: 'MCM', email: 'no-reply@example.test' }, to: [{ email: 'a@b.fr' }], subject: 'Bienvenue', htmlContent: '<b>hi</b>',
    });
  });

  it('fait échouer le job (pour réessai) quand Brevo répond en erreur', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'clé invalide' });
    startEmailWorker();
    await expect(workerNamed('email')!.processor({ id: 'j2', data: { to: 'a@b.fr', subject: 's', html: 'h' } })).rejects.toThrow('Brevo API 401: clé invalide');
  });

  it('journalise les échecs et ferme worker + file', async () => {
    startEmailWorker();
    workerNamed('email')!.handlers.failed!({ id: 'j3' }, new Error('boom'));
    expect(h.logger.error).toHaveBeenCalledWith({ jobId: 'j3', err: { message: 'boom' } }, 'email échoué');
    await closeEmailQueue();
    expect(workerNamed('email')!.close).toHaveBeenCalled();
    expect(queueNamed('email')!.close).toHaveBeenCalled();
  });
});

describe('search.queue', () => {
  const published = { id: 'p1', authorId: 'u1', title: 'Titre', body: 'Corps', tags: ['a'], status: 'published', createdAt: new Date('2026-01-02T03:04:05Z') };

  it('enfile une indexation', async () => {
    await enqueueSearchIndex('p1');
    expect((searchQueue as unknown as { add: ReturnType<typeof vi.fn> }).add).toHaveBeenCalledWith('index', { postId: 'p1' });
  });

  it('indexe un post publié dans Meilisearch', async () => {
    h.select.mockReturnValue(chain([published]));
    await processIndexPost({ postId: 'p1' });
    expect(h.addDocuments).toHaveBeenCalledWith([{ id: 'p1', authorId: 'u1', title: 'Titre', body: 'Corps', tags: ['a'], createdAt: '2026-01-02T03:04:05.000Z' }]);
  });

  it('remplace titre, corps et tags absents par des valeurs vides', async () => {
    h.select.mockReturnValue(chain([{ ...published, title: null, body: null, tags: null }]));
    await processIndexPost({ postId: 'p1' });
    expect(h.addDocuments.mock.calls[0]![0][0]).toMatchObject({ title: '', body: '', tags: [] });
  });

  it('n’indexe pas un post non publié', async () => {
    h.select.mockReturnValue(chain([{ ...published, status: 'flagged' }]));
    await processIndexPost({ postId: 'p1' });
    expect(h.addDocuments).not.toHaveBeenCalled();
  });

  it('échoue (pour réessai) quand le post est introuvable', async () => {
    h.select.mockReturnValue(chain([]));
    await expect(processIndexPost({ postId: 'nope' })).rejects.toThrow('Post introuvable : nope');
  });

  it('le worker délègue à processIndexPost, journalise les échecs et se ferme', async () => {
    startSearchWorker();
    expect(startSearchWorker()).toBe(startSearchWorker());
    const fake = workerNamed('search.index')!;
    h.select.mockReturnValue(chain([published]));
    await fake.processor({ data: { postId: 'p1' } });
    expect(h.addDocuments).toHaveBeenCalledTimes(1);
    fake.handlers.failed!({ id: 'j4' }, new Error('meili'));
    expect(h.logger.error).toHaveBeenCalledWith({ jobId: 'j4', err: { message: 'meili' } }, 'indexation search échouée');
    await closeSearchQueue();
    expect(fake.close).toHaveBeenCalled();
  });
});

describe('counters.queue', () => {
  it('planifie un flush toutes les 5 minutes et le worker applique posts + tribus', async () => {
    startCountersFlushWorker();
    expect(startCountersFlushWorker()).toBe(startCountersFlushWorker());
    expect(queueNamed('counters.flush')!.upsertJobScheduler).toHaveBeenCalledWith('every-5-min', { every: 300_000 }, { name: 'flush', data: {} });

    h.getDirtyPostIds.mockResolvedValue(['p1', 'p2']);
    h.flushCounters.mockResolvedValue(2);
    h.flushTribeVisitors.mockResolvedValue(1);
    const fake = workerNamed('counters.flush')!;
    await expect(fake.processor({ name: 'flush' })).resolves.toEqual({ postsFlushed: 2, tribesFlushed: 1 });
    expect(h.getDirtyPostIds).toHaveBeenCalledWith(1000);
    expect(h.flushCounters).toHaveBeenCalledWith(['p1', 'p2']);
  });

  it('ignore les jobs qui ne sont pas des flushs', async () => {
    startCountersFlushWorker();
    await expect(workerNamed('counters.flush')!.processor({ name: 'autre' })).resolves.toBeNull();
    expect(h.flushCounters).not.toHaveBeenCalled();
  });

  it('journalise les échecs et ferme worker + file', async () => {
    startCountersFlushWorker();
    const fake = workerNamed('counters.flush')!;
    fake.handlers.failed!(undefined, new Error('redis'));
    expect(h.logger.error).toHaveBeenCalledWith({ jobId: undefined, err: { message: 'redis' } }, 'flush counters échoué');
    await closeCountersFlushQueue();
    expect(fake.close).toHaveBeenCalled();
    expect(queueNamed('counters.flush')!.close).toHaveBeenCalled();
    expect(fakeWorkers.length).toBeGreaterThan(0);
  });
});
