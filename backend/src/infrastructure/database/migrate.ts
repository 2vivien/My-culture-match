import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { env } from '../../config/env';

/**
 * Runner de migrations pour la production (image Docker / CI).
 * `node dist/migrate.js` — lit les SQL dans `drizzle/` (journal Drizzle).
 * Surcharge du dossier via MIGRATIONS_DIR si besoin.
 */
const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL('../drizzle', import.meta.url));

const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  console.log(`✓ migrations appliquées (${MIGRATIONS_DIR})`);
} finally {
  await client.end({ timeout: 5 });
}
