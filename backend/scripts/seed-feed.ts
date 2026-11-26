import { createHash } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { closeDatabase, db, schema } from '../src/infrastructure/database';
import { closeRedis, redis } from '../src/infrastructure/redis';

/** Les mêmes clés que dans seed-mocks.sql : on réchauffe le feed Following. */
const POST_SEED_KEYS = [
  'seed-post-1',
  'seed-post-2',
  'seed-post-3',
  'seed-post-4',
  'seed-post-5',
  'seed-post-6',
  'seed-post-7',
  'seed-post-8',
];

const seedId = (key: string): string => createHash('md5').update(key).digest('hex');

async function main(): Promise<void> {
  const [me] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, 'agueoundev3443'))
    .limit(1);
  if (!me) throw new Error('User seed "agueoundev3443" introuvable — lance d’abord seed-mocks.sql.');

  const posts = await db
    .select({ id: schema.posts.id, authorId: schema.posts.authorId })
    .from(schema.posts)
    .where(inArray(schema.posts.id, POST_SEED_KEYS.map(seedId)));

  // Le feed masque les posts de l'utilisateur courant : on ne pousse que les autres.
  const visible = posts.filter((post) => post.authorId !== me.id);

  await db
    .insert(schema.follows)
    .values(visible.map((post) => ({ followerId: me.id, followingId: post.authorId })))
    .onConflictDoNothing();

  const feedKey = `feed:following:${me.id}`;
  await redis.del(feedKey);
  if (visible.length > 0) {
    const base = Date.now();
    const members: [number, string][] = visible.map((post, index) => [base + index, post.id]);
    await redis.zadd(feedKey, ...members);
  }

  console.log(`Feed following réchauffé : ${visible.length} post(s) pour ${me.id}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeRedis();
    await closeDatabase();
  });
