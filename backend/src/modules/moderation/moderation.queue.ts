import { Queue, Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { db, schema } from '../../infrastructure/database';
import { logger } from '../../middleware/logger';
import { moderatePost, moderateText } from '../posts/moderation';
import { createNotification } from '../notifications/notifications.service';

export const MODERATION_QUEUE_NAME = 'moderation.scan';
export const MODERATION_DLQ_NAME = 'moderation.scan.dlq';

export type ModerationTargetType = 'post' | 'comment' | 'story';

export interface ModerationJob {
  targetType: ModerationTargetType;
  targetId: string;
}

export const moderationQueue = new Queue<ModerationJob>(MODERATION_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: 1_000,
    removeOnFail: 0, // les jobs échoués partent en dead letter
  },
});

/** Dead letter queue : conservation des échecs définitifs. */
export const moderationDlq = new Queue<ModerationJob>(MODERATION_DLQ_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: { removeOnComplete: 0, removeOnFail: 5_000 },
});

export async function enqueueModerationScan(targetType: ModerationTargetType, targetId: string): Promise<void> {
  await moderationQueue.add('scan', { targetType, targetId });
}

/**
 * Scan auto-modération d'une entité (heuristique hors-ligne).
 * Post/commentaire toxique → status 'flagged' (+ notif à l'auteur).
 * Story toxique → suppression + notif.
 */
export async function processModerationScan(job: ModerationJob): Promise<{ flag: boolean; reason: string | null }> {
  const { targetType, targetId } = job;

  if (targetType === 'post') {
    const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, targetId)).limit(1);
    if (!post) return { flag: false, reason: null };
    const result = moderatePost(post.title ?? '', post.body ?? '');
    if (result.flag && post.status === 'published') {
      await db.update(schema.posts).set({ status: 'flagged', updatedAt: new Date() }).where(eq(schema.posts.id, targetId));
      await createNotification({
        userId: post.authorId,
        actorId: null,
        type: 'system',
        action: 'moderation.flagged',
        target: targetId,
        metadata: { reason: result.reason },
      });
    }
    return result;
  }

  if (targetType === 'comment') {
    const [comment] = await db.select().from(schema.comments).where(eq(schema.comments.id, targetId)).limit(1);
    if (!comment) return { flag: false, reason: null };
    const result = moderateText(comment.text);
    if (result.flag && comment.status === 'published') {
      await db.update(schema.comments).set({ status: 'flagged' }).where(eq(schema.comments.id, targetId));
      await createNotification({
        userId: comment.userId,
        actorId: null,
        type: 'system',
        action: 'moderation.flagged',
        target: comment.postId,
        metadata: { reason: result.reason, commentId: targetId },
      });
    }
    return result;
  }

  if (targetType === 'story') {
    const [story] = await db.select().from(schema.stories).where(eq(schema.stories.id, targetId)).limit(1);
    if (!story) return { flag: false, reason: null };
    const result = moderateText(story.caption ?? '');
    if (result.flag) {
      await db.delete(schema.stories).where(eq(schema.stories.id, targetId));
      await createNotification({
        userId: story.userId,
        actorId: null,
        type: 'system',
        action: 'moderation.removed',
        target: targetId,
        metadata: { reason: result.reason, entity: 'story' },
      });
    }
    return result;
  }

  return { flag: false, reason: null };
}

let worker: Worker<ModerationJob> | null = null;

export function startModerationWorker(): Worker<ModerationJob> {
  if (worker) return worker;
  worker = new Worker<ModerationJob>(
    MODERATION_QUEUE_NAME,
    async (job) => {
      await processModerationScan(job.data);
    },
    { connection: { url: env.REDIS_URL }, concurrency: 10 },
  );
  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err: { message: err.message } }, 'modération échouée');
    if (job && job.attemptsMade >= (job.opts?.attempts ?? 3)) {
      await moderationDlq.add('scan', job.data, { jobId: `dlq-${job.id}` });
    }
  });
  return worker;
}

export async function closeModerationQueue(): Promise<void> {
  await worker?.close();
  await moderationQueue.close();
  await moderationDlq.close();
}
