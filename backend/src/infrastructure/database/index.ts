import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../../config/env';
import * as schema from './schema';

/** Client postgres-js (driver imposé par le Prompt Master, Neon-compatible). */
const client = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_SIZE,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

/** Client Drizzle unique pour l'application. */
export const db = drizzle(client, { schema });

/** Vérifie la connectivité de la base (healthcheck). */
export async function checkDatabase(): Promise<void> {
  await client`SELECT 1`;
}

/** Ferme proprement le client (shutdown). */
export async function closeDatabase(): Promise<void> {
  await client.end({ timeout: 5 });
}

export { schema };
