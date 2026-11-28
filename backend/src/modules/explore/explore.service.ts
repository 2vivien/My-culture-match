import { desc, eq, and, isNull, inArray, sql } from 'drizzle-orm';
import { readablePostCondition } from '../tribes/tribes.access';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { tribeVisitorsKey } from '../tribes/tribes.service';

/** Formatte un nombre en string abrégée (ex: 4600 → "4.6K"). */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

/** GET /api/explore — données agrégées pour la page Explorer. */
export async function getExploreData(userId: string) {
  // 1. Tribus populaires (top 8 par nombre de membres)
  const tribesRaw = await db
    .select()
    .from(schema.tribes)
    // Une tribu privée n'apparaît qu'à ses membres.
    .where(sql`(${schema.tribes.visibility} = 'public' OR EXISTS (SELECT 1 FROM tribe_members m WHERE m.tribe_id = ${schema.tribes.id} AND m.user_id = ${userId}))`)
    .orderBy(desc(schema.tribes.memberCount))
    .limit(8);

  const tribeIds = tribesRaw.map((t) => t.id);

  // Récupérer les compteurs visiteurs Redis pour les tribus
  const visitorCounts = await Promise.all(
    tribeIds.map(async (id) => {
      const raw = await redis.get(tribeVisitorsKey(id));
      return raw ? Number(raw) : 0;
    }),
  );

  // Vérifier quels membres le user a rejoint
  const userMemberships = userId
    ? await db
        .select({ tribeId: schema.tribeMembers.tribeId })
        .from(schema.tribeMembers)
        .where(eq(schema.tribeMembers.userId, userId))
    : [];
  const joinedTribeIds = new Set(userMemberships.map((m) => m.tribeId));

  const tribes = tribesRaw.map((t, i) => ({
    id: t.id,
    name: t.name,
    tag: t.tag ?? '',
    visitors: formatCount(t.visitors + (visitorCounts[i] ?? 0)),
    desc: t.desc ?? '',
    avatar: t.avatar ?? '',
    joined: joinedTribeIds.has(t.id),
    glow: t.glow ?? 'none',
  }));

  // Diviser en tribes principales et "moreTribes"
  const mainTribes = tribes.slice(0, 6);
  const moreTribes = tribes.slice(6);

  // 2. Compagnons — top connections du user par matchScore
  const companionsRaw = await db
    .select({
      userId: schema.connections.toUserId,
      matchScore: schema.connections.matchScore,
    })
    .from(schema.connections)
    .where(
      and(
        eq(schema.connections.fromUserId, userId),
        eq(schema.connections.status, 'companion'),
      ),
    )
    .orderBy(desc(schema.connections.matchScore))
    .limit(4);

  let companions: {
    id: string;
    name: string;
    avatar: string;
    matchScore: number;
    level: number;
    glow: string;
    interests: string[];
    connected: boolean;
  }[] = [];

  if (companionsRaw.length > 0) {
    const companionUserIds = companionsRaw.map((c) => c.userId);
    const companionUsers = await db
      .select()
      .from(schema.users)
      .where(
        inArray(schema.users.id, companionUserIds),
      );

    const userMap = new Map(companionUsers.map((u) => [u.id, u]));

    companions = companionsRaw.map((c) => {
      const u = userMap.get(c.userId);
      return {
        id: c.userId,
        name: u?.name ?? 'Unknown',
        avatar: u?.avatar ?? `https://api.dicebear.com/7.x/open-peeps/svg?seed=${c.userId}`,
        matchScore: c.matchScore,
        level: u?.level ?? 1,
        glow: (u?.glow ?? 'none') as string,
        interests: (u?.values as string[]) ?? [],
        connected: true,
      };
    });
  }

  // 3. Images — posts de type Images avec au moins un mediaUrl
  const imagePosts = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      image: schema.posts.image,
      mediaUrls: schema.posts.mediaUrls,
      likes: schema.posts.likes,
      comments: schema.posts.comments,
      tags: schema.posts.tags,
    })
    .from(schema.posts)
    .where(and(eq(schema.posts.type, 'Images'), eq(schema.posts.status, 'published'), isNull(schema.posts.deletedAt), readablePostCondition(userId)))
    .orderBy(desc(schema.posts.likes))
    .limit(6);

  const images = imagePosts.map((p) => {
    const urls = (p.mediaUrls as string[]) ?? [];
    const url = p.image ?? urls[0] ?? '';
    const tags = (p.tags as string[]) ?? [];
    return {
      id: p.id,
      url,
      title: p.title ?? '',
      likes: formatCount(p.likes),
      comments: formatCount(p.comments),
      category: tags[0] ?? 'Culture',
    };
  });

  // 4. Vidéos — même chose, on filtre les posts avec media
  const videoPosts = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      image: schema.posts.image,
      mediaUrls: schema.posts.mediaUrls,
      views: schema.posts.views,
      tags: schema.posts.tags,
    })
    .from(schema.posts)
    .where(and(eq(schema.posts.type, 'Images'), eq(schema.posts.status, 'published'), isNull(schema.posts.deletedAt), readablePostCondition(userId)))
    .orderBy(desc(schema.posts.views))
    .limit(4);

  const videos = videoPosts.map((p) => {
    const urls = (p.mediaUrls as string[]) ?? [];
    const thumbnail = p.image ?? urls[0] ?? '';
    const tags = (p.tags as string[]) ?? [];
    return {
      id: p.id,
      thumbnail,
      title: p.title ?? '',
      duration: '0:00',
      plays: formatCount(p.views),
      category: tags[0] ?? 'Culture',
    };
  });

  return { tribes: mainTribes, moreTribes, companions, images, videos };
}
