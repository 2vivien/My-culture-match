import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
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

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth:
    env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
});

/** Traitement d'un job email (exécuté dans le worker). */
export async function sendEmailJob(job: EmailJob): Promise<void> {
  await transporter.sendMail({
    from: `"${env.BREVO_SENDER_NAME}" <${env.BREVO_SENDER_EMAIL}>`,
    to: job.to,
    subject: job.subject,
    html: job.html,
  });
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
