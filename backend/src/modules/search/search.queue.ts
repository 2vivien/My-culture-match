import { Queue, Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { db, schema } from '../../infrastructure/database';
import { meilisearch } from '../../infrastructure/meilisearch';
import { logger } from '../../middleware/logger';

export const SEARCH_QUEUE_NAME = 'search.index';
export const POSTS_INDEX = 'posts';

export interface SearchIndexJob {
  postId: string;
}

export const searchQueue = new Queue<SearchIndexJob>(SEARCH_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000,
  },
});

export async function enqueueSearchIndex(postId: string): Promise<void> {
  await searchQueue.add('index', { postId });
}

/** Indexe un post dans Meilisearch (utilisé par le fanout post-création). */
export async function processIndexPost(job: SearchIndexJob): Promise<void> {
  const [post] = await db
    .select({
      id: schema.posts.id,
      authorId: schema.posts.authorId,
      title: schema.posts.title,
      body: schema.posts.body,
      tags: schema.posts.tags,
      status: schema.posts.status,
      createdAt: schema.posts.createdAt,
    })
    .from(schema.posts)
    .where(eq(schema.posts.id, job.postId))
    .limit(1);
  if (!post) throw new Error(`Post introuvable : ${job.postId}`);
  if (post.status !== 'published') return;

  await meilisearch.index(POSTS_INDEX).addDocuments([
    {
      id: post.id,
      authorId: post.authorId,
      title: post.title ?? '',
      body: post.body ?? '',
      tags: post.tags ?? [],
      createdAt: post.createdAt.toISOString(),
    },
  ]);
}

let worker: Worker<SearchIndexJob> | null = null;

export function startSearchWorker(): Worker<SearchIndexJob> {
  if (worker) return worker;
  worker = new Worker<SearchIndexJob>(
    SEARCH_QUEUE_NAME,
    async (job) => {
      await processIndexPost(job.data);
    },
    { connection: { url: env.REDIS_URL }, concurrency: 2 },
  );
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: { message: err.message } }, 'indexation search échouée');
  });
  return worker;
}

export async function closeSearchQueue(): Promise<void> {
  await worker?.close();
  await searchQueue.close();
}
