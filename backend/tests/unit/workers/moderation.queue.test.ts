import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chain } from '../helpers/drizzle-fake';
import { moderateText, moderatePost } from '../../../src/modules/posts/moderation';

vi.mock('bullmq', async () => (await import('../helpers/bullmq-fake')).bullmqFake);
vi.mock('../../../src/config/env', () => ({ env: { REDIS_URL: 'redis://test' } }));
vi.mock('../../../src/middleware/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
// Le worker invalide le cache Redis du post : ce test unitaire ne doit pas ouvrir de vraie connexion.
vi.mock('../../../src/infrastructure/redis', () => ({ redis: { del: vi.fn().mockResolvedValue(1) } }));

const h = vi.hoisted(() => ({ select: vi.fn(), update: vi.fn(), delete: vi.fn(), createNotification: vi.fn() }));
vi.mock('../../../src/infrastructure/database', () => ({
  db: { select: h.select, update: h.update, delete: h.delete },
  schema: {
    posts: { id: 'posts.id' },
    comments: { id: 'comments.id' },
    stories: { id: 'stories.id' },
  },
}));
vi.mock('../../../src/modules/notifications/notifications.service', () => ({ createNotification: h.createNotification }));

import {
  closeModerationQueue, enqueueModerationScan, moderationDlq, moderationQueue, processModerationScan,
  startModerationWorker,
} from '../../../src/modules/moderation/moderation.queue';
import { fakeWorkers } from '../helpers/bullmq-fake';

beforeEach(() => {
  vi.clearAllMocks();
  h.createNotification.mockResolvedValue(undefined);
});

describe('heuristique de modération', () => {
  it.each([
    ['ferme ta gueule', 'TOXIC_LANGUAGE'],
    ['Je vais te tuer', 'TOXIC_LANGUAGE'],
    ['https://a.io https://b.io https://c.io', 'SPAM'],
  ])('signale « %s » (%s)', (text, reason) => {
    expect(moderateText(text)).toEqual({ flag: true, reason });
  });

  it('laisse passer un texte normal ou vide', () => {
    expect(moderateText('Superbe concert hier soir, merci !')).toEqual({ flag: false, reason: null });
    expect(moderateText('https://a.io https://b.io')).toEqual({ flag: false, reason: null });
  });

  it('moderatePost examine le titre puis le corps', () => {
    expect(moderatePost('Titre propre', 'ta gueule').flag).toBe(true);
    expect(moderatePost('connard', 'texte propre')).toEqual({ flag: true, reason: 'TOXIC_LANGUAGE' });
    expect(moderatePost('Titre propre')).toEqual({ flag: false, reason: null });
  });
});

describe('processModerationScan', () => {
  it('ignore une cible introuvable', async () => {
    for (const targetType of ['post', 'comment', 'story'] as const) {
      h.select.mockReturnValueOnce(chain([]));
      await expect(processModerationScan({ targetType, targetId: 'x' })).resolves.toEqual({ flag: false, reason: null });
    }
    expect(h.createNotification).not.toHaveBeenCalled();
  });

  it('passe un post publié toxique en « flagged » et prévient son auteur', async () => {
    h.select.mockReturnValueOnce(chain([{ authorId: 'u1', title: 'Hello', body: 'ferme ta gueule', status: 'published' }]));
    const upd = chain(undefined);
    h.update.mockReturnValue(upd);
    await expect(processModerationScan({ targetType: 'post', targetId: 'p1' })).resolves.toEqual({ flag: true, reason: 'TOXIC_LANGUAGE' });
    expect(upd.args.set![0]).toMatchObject({ status: 'flagged' });
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1', actorId: null, action: 'moderation.flagged', target: 'p1', metadata: { reason: 'TOXIC_LANGUAGE' },
    }));
  });

  it('ne modifie pas un post toxique qui n’est plus « published »', async () => {
    h.select.mockReturnValueOnce(chain([{ authorId: 'u1', title: 'x', body: 'connard', status: 'deleted' }]));
    const out = await processModerationScan({ targetType: 'post', targetId: 'p1' });
    expect(out.flag).toBe(true);
    expect(h.update).not.toHaveBeenCalled();
    expect(h.createNotification).not.toHaveBeenCalled();
  });

  it('ne fait rien pour un post propre', async () => {
    h.select.mockReturnValueOnce(chain([{ authorId: 'u1', title: null, body: null, status: 'published' }]));
    await expect(processModerationScan({ targetType: 'post', targetId: 'p1' })).resolves.toEqual({ flag: false, reason: null });
    expect(h.update).not.toHaveBeenCalled();
  });

  it('signale un commentaire toxique et notifie avec le post concerné', async () => {
    h.select.mockReturnValueOnce(chain([{ userId: 'u2', postId: 'p9', text: 'sale arabe', status: 'published' }]));
    h.update.mockReturnValue(chain(undefined));
    await processModerationScan({ targetType: 'comment', targetId: 'c1' });
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u2', target: 'p9', metadata: { reason: 'TOXIC_LANGUAGE', commentId: 'c1' },
    }));
  });

  it('supprime une story toxique et prévient son auteur', async () => {
    h.select.mockReturnValueOnce(chain([{ userId: 'u3', caption: 'dégage' }]));
    const del = chain(undefined);
    h.delete.mockReturnValue(del);
    await expect(processModerationScan({ targetType: 'story', targetId: 's1' })).resolves.toMatchObject({ flag: true });
    expect(h.delete).toHaveBeenCalledTimes(1);
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u3', action: 'moderation.removed', metadata: { reason: 'TOXIC_LANGUAGE', entity: 'story' },
    }));
  });

  it('conserve une story propre (légende absente)', async () => {
    h.select.mockReturnValueOnce(chain([{ userId: 'u3', caption: null }]));
    await expect(processModerationScan({ targetType: 'story', targetId: 's1' })).resolves.toEqual({ flag: false, reason: null });
    expect(h.delete).not.toHaveBeenCalled();
  });

  it('renvoie « propre » pour un type de cible inconnu', async () => {
    await expect(processModerationScan({ targetType: 'autre' as never, targetId: 'x' })).resolves.toEqual({ flag: false, reason: null });
  });
});

describe('file et worker de modération', () => {
  it('enfile un scan', async () => {
    await enqueueModerationScan('post', 'p1');
    expect((moderationQueue as unknown as { add: ReturnType<typeof vi.fn> }).add).toHaveBeenCalledWith('scan', { targetType: 'post', targetId: 'p1' });
  });

  it('le worker est un singleton qui traite les jobs avec processModerationScan', async () => {
    const w = startModerationWorker();
    expect(startModerationWorker()).toBe(w);
    const fake = fakeWorkers.find((x) => x.name === 'moderation.scan')!;
    expect(fake.opts).toMatchObject({ concurrency: 10 });
    h.select.mockReturnValueOnce(chain([]));
    await expect(fake.processor({ data: { targetType: 'post', targetId: 'p1' } })).resolves.toBeUndefined();
    expect(h.select).toHaveBeenCalledTimes(1);
  });

  it('envoie un job dans la dead letter queue après le dernier essai seulement', async () => {
    startModerationWorker();
    const onFailed = fakeWorkers.find((x) => x.name === 'moderation.scan')!.handlers.failed!;
    const dlqAdd = (moderationDlq as unknown as { add: ReturnType<typeof vi.fn> }).add;
    await onFailed({ id: 'j1', data: { targetType: 'post', targetId: 'p1' }, attemptsMade: 1, opts: { attempts: 3 } }, new Error('boom'));
    expect(dlqAdd).not.toHaveBeenCalled();
    await onFailed({ id: 'j1', data: { targetType: 'post', targetId: 'p1' }, attemptsMade: 3, opts: { attempts: 3 } }, new Error('boom'));
    expect(dlqAdd).toHaveBeenCalledWith('scan', { targetType: 'post', targetId: 'p1' }, { jobId: 'dlq-j1' });
  });

  it('ferme le worker et les deux files', async () => {
    startModerationWorker();
    await closeModerationQueue();
    expect((moderationQueue as unknown as { close: ReturnType<typeof vi.fn> }).close).toHaveBeenCalled();
    expect((moderationDlq as unknown as { close: ReturnType<typeof vi.fn> }).close).toHaveBeenCalled();
  });
});
