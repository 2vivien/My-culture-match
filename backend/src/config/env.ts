import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const portNumber = z.coerce.number().int().positive();
const booleanFlag = z.preprocess((v) => {
  if (v === undefined || v === '') return undefined;
  if (v === 'true' || v === '1' || v === 'on') return true;
  if (v === 'false' || v === '0' || v === 'off') return false;
  return undefined;
}, z.boolean().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: portNumber.default(3000),
  API_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),
  DATABASE_POOL_SIZE: portNumber.default(20),

  REDIS_URL: z.string().min(1, 'REDIS_URL est obligatoire'),
  REDIS_POOL_SIZE: portNumber.default(10),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET doit contenir au moins 32 caractères'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  APPLE_CLIENT_ID: z.string().optional().default(''),
  APPLE_CLIENT_SECRET: z.string().optional().default(''),

  BREVO_API_KEY: z.string().optional().default(''),
  BREVO_SENDER_EMAIL: z.string().email().default('noreply@myculturematch.com'),
  BREVO_SENDER_NAME: z.string().default('My Culture Match'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: portNumber.default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),

  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: portNumber.default(9000),
  MINIO_USE_SSL: booleanFlag.default(false),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET_NAME: z.string().default('mcm-media'),

  MEILISEARCH_HOST: z.string().url().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: z.string().default('masterKey'),

  ARCJET_KEY: z.string().optional().default(''),

  SENTRY_DSN: z.string().optional().default(''),
  BETTER_STACK_SOURCE_TOKEN: z.string().optional().default(''),

  METRICS_TOKEN: z.string().optional().default(''),

  CULTURE_ENGINE_BATCH_ENABLED: booleanFlag.default(true),
  CULTURE_ENGINE_VERSION: z.string().default('v1'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse et valide les variables d'environnement au démarrage.
 * Fail fast : si une variable obligatoire manque, le processus s'arrête
 * avec un message clair listant les erreurs.
 */
export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`[ENV] Configuration invalide :\n${details}`);
  }

  return result.data;
}

/** Singleton de configuration, chargé une seule fois. */
export const env: Env = loadEnv();
