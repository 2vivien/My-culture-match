import { Queue, Worker } from 'bullmq';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';

export const EMAIL_QUEUE_NAME = 'email';

/** File BullMQ pour les envois d'emails asynchrones. */
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000,
  },
});

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
}

/** Envoi d'email via l'API Brevo (REST). */
async function sendEmailJob(job: EmailJob): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
      to: [{ email: job.to }],
      subject: job.subject,
      htmlContent: job.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API ${res.status}: ${body}`);
  }
}

/** Enfile un email dans la queue. */
export async function enqueueEmail(job: EmailJob): Promise<void> {
  await emailQueue.add('send', job);
}

// ── Worker BullMQ (consomme la queue email) ────────────────
let worker: Worker<EmailJob> | null = null;

export function startEmailWorker(): Worker<EmailJob> {
  if (worker) return worker;

  worker = new Worker<EmailJob>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      logger.info({ jobId: job.id, to: job.data.to }, 'envoi email');
      await sendEmailJob(job.data);
    },
    { connection: { url: env.REDIS_URL }, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: { message: err.message } }, 'email échoué');
  });

  return worker;
}

export async function closeEmailQueue(): Promise<void> {
  await worker?.close();
  await emailQueue.close();
}
