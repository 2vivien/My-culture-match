import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../../config/env';
import * as schemaBase from './schema';
import * as consentSchema from '../../modules/consent/consent.schema';

const client = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_SIZE,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

/** Client Drizzle unique pour l'application. */
const schema = { ...schemaBase, ...consentSchema };
export { schema };
export const db = drizzle(client, { schema });

export async function checkDatabase(): Promise<void> {
  await client`SELECT 1`;
}

export async function closeDatabase(): Promise<void> {
  await client.end({ timeout: 5 });
}
