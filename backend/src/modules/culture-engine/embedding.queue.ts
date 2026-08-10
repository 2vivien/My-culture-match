import { Queue, Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { db, schema } from '../../infrastructure/database';
import { logger } from '../../middleware/logger';
import { hashEmbedding, tokenize } from '../culture-engine/embedding';

export const EMBEDDING_QUEUE_NAME = 'post.embedding';

export interface EmbeddingJob {
  postId: string;
}

export const embeddingQueue = new Queue<EmbeddingJob>(EMBEDDING_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000,
  },
});

export async function enqueuePostEmbedding(postId: string): Promise<void> {
  await embeddingQueue.add('embed', { postId });
}

/** Calcule l'embedding d'un post (titre + body + tags) et le stocke. */
export async function processEmbedding(job: EmbeddingJob): Promise<void> {
  const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, job.postId)).limit(1);
  if (!post) throw new Error(`Post introuvable : ${job.postId}`);

  const tokens = tokenize(`${post.title ?? ''} ${post.body ?? ''}`).concat(post.tags ?? []);
  const vector = hashEmbedding(tokens);
  await db
    .insert(schema.postProfileVectors)
    .values({ postId: job.postId, vector, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.postProfileVectors.postId, set: { vector, updatedAt: new Date() } });
}

let worker: Worker<EmbeddingJob> | null = null;

export function startEmbeddingWorker(): Worker<EmbeddingJob> {
  if (worker) return worker;
  worker = new Worker<EmbeddingJob>(
    EMBEDDING_QUEUE_NAME,
    async (job) => {
      await processEmbedding(job.data);
    },
    { connection: { url: env.REDIS_URL }, concurrency: 2 },
  );
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: { message: err.message } }, 'embedding échoué');
  });
  return worker;
}

export async function closeEmbeddingQueue(): Promise<void> {
  await worker?.close();
  await embeddingQueue.close();
}
