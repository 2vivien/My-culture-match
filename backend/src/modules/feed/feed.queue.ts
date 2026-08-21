import { Queue, Worker } from 'bullmq';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';
import { fanoutPostToFollowers } from './fanout';

export const FEED_FANOUT_QUEUE_NAME = 'feed.fanout';

export interface FeedFanoutJob {
  postId: string;
  authorId: string;
}

export const feedFanoutQueue = new Queue<FeedFanoutJob>(FEED_FANOUT_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000,
  },
});

export async function enqueueFeedFanout(postId: string, authorId: string): Promise<void> {
  await feedFanoutQueue.add('fanout', { postId, authorId });
}

let worker: Worker<FeedFanoutJob> | null = null;

export function startFeedFanoutWorker(): Worker<FeedFanoutJob> {
  if (worker) return worker;
  worker = new Worker<FeedFanoutJob>(
    FEED_FANOUT_QUEUE_NAME,
    async (job) => {
      await fanoutPostToFollowers(job.data.postId, job.data.authorId);
    },
    { connection: { url: env.REDIS_URL }, concurrency: 2 },
  );
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: { message: err.message } }, 'fanout feed échoué');
  });
  return worker;
}

export async function closeFeedFanoutQueue(): Promise<void> {
  await worker?.close();
  await feedFanoutQueue.close();
}
