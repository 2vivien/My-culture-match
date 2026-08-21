import { describe, it, expect, afterEach } from 'vitest';
import { redis } from '../../../src/infrastructure/redis';
import {
  CELEBRITY_FOLLOWER_THRESHOLD,
  addFollower,
  removeFollower,
  getFollowers,
  fanoutPostToFollowers,
  removeFromFeeds,
  followingKey,
} from '../../../src/modules/feed/fanout';

let counter = 0;
const authorId = () => `unit-author-${Date.now()}-${counter++}`;
const followerId = () => `unit-follower-${Date.now()}-${counter++}`;
const postId = () => `unit-post-${Date.now()}-${counter++}`;

afterEach(async () => {
  const keys = await redis.keys('unit-*');
  if (keys.length > 0) await redis.del(...keys);
  const followers = await redis.keys('followers:unit-*');
  if (followers.length > 0) await redis.del(...followers);
});

describe('fanout — suivi des followers (Redis)', () => {
  it('addFollower → getFollowers retourne le follower', async () => {
    const author = authorId();
    const follower = followerId();
    await addFollower(author, follower);
    const followers = await getFollowers(author);
    expect(followers).toContain(follower);
  });

  it('removeFollower retire le follower', async () => {
    const author = authorId();
    const follower = followerId();
    await addFollower(author, follower);
    await removeFollower(author, follower);
    const followers = await getFollowers(author);
    expect(followers).not.toContain(follower);
  });
});

describe('fanout — push vers les feeds following', () => {
  it('pousse le post dans le feed de chaque follower', async () => {
    const author = authorId();
    const f1 = followerId();
    const f2 = followerId();
    const p = postId();
    await addFollower(author, f1);
    await addFollower(author, f2);

    const result = await fanoutPostToFollowers(p, author);
    expect(result.pushed).toBe(2);
    expect(result.skipped).toBe(false);

    expect(await redis.zscore(followingKey(f1), p)).not.toBeNull();
    expect(await redis.zscore(followingKey(f2), p)).not.toBeNull();
  });

  it('passe en mode PULL (skip) au-delà du seuil célébrité', async () => {
    const author = authorId();
    const ids = Array.from({ length: CELEBRITY_FOLLOWER_THRESHOLD }, (_, i) => `bulk-follower-${i}`);
    await redis.sadd(`followers:${author}`, ...ids);

    const result = await fanoutPostToFollowers(postId(), author);
    expect(result.pushed).toBe(0);
    expect(result.skipped).toBe(true);
  });

  it('removeFromFeeds marque le post comme supprimé (cache)', async () => {
    const p = postId();
    await removeFromFeeds(p);
    expect(await redis.get(`post:deleted:${p}`)).toBe('1');
  });
});
