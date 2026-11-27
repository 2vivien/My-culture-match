import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../../config/env';
import * as schemaBase from './schema';
import * as consentSchema from '../../modules/consent/consent.schema';
import * as safetySchema from '../../modules/safety/safety.schema';
import * as abuseSchema from '../../modules/safety/abuse.schema';

const client = postgres(env.DATABASE_URL, { max: env.DATABASE_POOL_SIZE, idle_timeout: 20, connect_timeout: 10, prepare: false });
const schema = { ...schemaBase, ...consentSchema, ...safetySchema, ...abuseSchema };
/** Types de lignes accessibles via `schema.User`, `schema.Post`… (le `schema` runtime est un objet fusionné). */
// eslint-disable-next-line @typescript-eslint/no-namespace -- fusion de déclaration : types de lignes sous le même nom que l'objet runtime
declare namespace schema {
  type User = schemaBase.User;
  type UserSettingsRow = schemaBase.UserSettingsRow;
  type Post = schemaBase.Post;
  type Message = schemaBase.Message;
  type Notification = schemaBase.Notification;
  type Story = schemaBase.Story;
}
export { schema };
export const db = drizzle(client, { schema });
export async function checkDatabase(): Promise<void> { await client`SELECT 1`; }
export async function closeDatabase(): Promise<void> { await client.end({ timeout: 5 }); }
