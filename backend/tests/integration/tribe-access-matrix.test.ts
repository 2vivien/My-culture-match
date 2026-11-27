import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function login(prefix = 'mtx'): Promise<string> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.60.${Math.floor(Math.random() * 200)}.1`;
  await app.request('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email }),
  });
  const code = await getOtpCode(email);
  const res = await app.request('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, code }),
  });
  return ((await res.json()) as { token: string }).token;
}

async function createTribe(token: string, overrides: Record<string, unknown> = {}) {
  const tag = `trb-${unique()}`;
  return app.request('/api/tribes', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: `Danse du Sud ${unique()}`,
      tag,
      topic: 'danse',
      description: 'Partageons nos pas de danse ancestraux.',
      rules: [
        { title: 'Respect', description: 'Pas d’insultes' },
        { title: 'Authenticité', description: 'Partagez des contenus vérifiés' },
      ],
      ...overrides,
    }),
  });
}

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await closeFeedFanoutQueue();
  await closeSearchQueue();
  await closeEmbeddingQueue();
  await closeCountersFlushQueue();
  await redis.quit();
});

const auth = (token: string) => ({ 'content-type': 'application/json', Authorization: `Bearer ${token}` });
const json = async <T>(res: Response) => (await res.json()) as T;
const meId = async (token: string) => (await json<{ id: string }>(await app.request('/api/users/me', { headers: auth(token) }))).id;

type Actor = 'owner' | 'member' | 'pending' | 'outsider' | 'leaver';
interface World { tribeId: string; postId: string; commentId: string; tokens: Record<Actor, string> }

/** Tribu privée avec un post et un commentaire ; cinq acteurs aux relations différentes avec elle. */
async function buildWorld(): Promise<World> {
  const tokens = { owner: await login(), member: await login(), pending: await login(), outsider: await login(), leaver: await login() };
  const tribeId = (await json<{ id: string }>(await createTribe(tokens.owner, { visibility: 'private' }))).id;
  const join = (t: string) => app.request(`/api/tribes/${tribeId}/join`, { method: 'POST', headers: auth(t) });
  const approve = async (t: string) => app.request(`/api/tribes/${tribeId}/join-requests/${await meId(t)}/approve`, { method: 'POST', headers: auth(tokens.owner) });

  await join(tokens.member); await approve(tokens.member);
  await join(tokens.leaver); await approve(tokens.leaver);
  await join(tokens.pending);

  const post = await app.request('/api/posts', { method: 'POST', headers: auth(tokens.owner), body: JSON.stringify({ type: 'Text', title: `Secret ${unique()}`, body: 'Contenu privé', tribeId }) });
  const postId = (await json<{ id: string }>(post)).id;
  const comment = await app.request(`/api/posts/${postId}/comments`, { method: 'POST', headers: auth(tokens.owner), body: JSON.stringify({ text: 'Commentaire privé' }) });
  const commentId = (await json<{ commentId: string }>(comment)).commentId;

  // Le futur ex-membre enregistre le post avant de quitter la tribu.
  await app.request(`/api/posts/${postId}/save`, { method: 'POST', headers: auth(tokens.leaver) });
  expect((await app.request(`/api/tribes/${tribeId}/leave`, { method: 'DELETE', headers: auth(tokens.leaver) })).status).toBe(200);
  return { tribeId, postId, commentId, tokens };
}

let world: World;
beforeAll(async () => { world = await buildWorld(); });

const DENIED: Actor[] = ['pending', 'outsider', 'leaver'];

/** Chaque entrée : une action, le statut refusé aux non-membres, et les statuts acceptables pour un membre. */
const surfaces: Array<{ name: string; call: (w: World, t: string) => Response | Promise<Response>; denied: number; memberOk: number[] }> = [
  { name: 'GET posts de la tribu', call: (w, t) => app.request(`/api/tribes/${w.tribeId}/posts`, { headers: auth(t) }), denied: 403, memberOk: [200] },
  { name: 'GET flairs de la tribu', call: (w, t) => app.request(`/api/tribes/${w.tribeId}/flairs`, { headers: auth(t) }), denied: 403, memberOk: [200] },
  { name: 'GET détail du post', call: (w, t) => app.request(`/api/posts/${w.postId}`, { headers: auth(t) }), denied: 404, memberOk: [200] },
  { name: 'GET commentaires', call: (w, t) => app.request(`/api/posts/${w.postId}/comments`, { headers: auth(t) }), denied: 404, memberOk: [200] },
  { name: 'POST commentaire', call: (w, t) => app.request(`/api/posts/${w.postId}/comments`, { method: 'POST', headers: auth(t), body: JSON.stringify({ text: 'Intrusion' }) }), denied: 404, memberOk: [201, 200] },
  { name: 'POST like', call: (w, t) => app.request(`/api/posts/${w.postId}/like`, { method: 'POST', headers: auth(t) }), denied: 404, memberOk: [200] },
  { name: 'POST partage', call: (w, t) => app.request(`/api/posts/${w.postId}/share`, { method: 'POST', headers: auth(t) }), denied: 404, memberOk: [200] },
  { name: 'POST enregistrer', call: (w, t) => app.request(`/api/posts/${w.postId}/save`, { method: 'POST', headers: auth(t) }), denied: 404, memberOk: [200] },
  { name: 'POST vote', call: (w, t) => app.request(`/api/tribu/posts/${w.postId}/upvote`, { method: 'POST', headers: auth(t), body: JSON.stringify({ value: 1 }) }), denied: 404, memberOk: [200] },
  { name: 'POST publier dans la tribu', call: (w, t) => app.request(`/api/tribes/${w.tribeId}/posts`, { method: 'POST', headers: auth(t), body: JSON.stringify({ type: 'Text', title: 'Intrusion', body: 'x' }) }), denied: 403, memberOk: [201] },
  { name: 'PUT flair d’un post', call: (w, t) => app.request(`/api/tribes/${w.tribeId}/posts/${w.postId}/flair`, { method: 'PUT', headers: auth(t), body: JSON.stringify({ flairId: null }) }), denied: 403, memberOk: [403, 200] },
  { name: 'POST signalement de post (tribu)', call: (w, t) => app.request(`/api/tribes/${w.tribeId}/posts/${w.postId}/report`, { method: 'POST', headers: auth(t), body: JSON.stringify({ reason: 'Contenu douteux' }) }), denied: 403, memberOk: [200] },
  { name: 'POST signalement de post (global)', call: (w, t) => app.request('/api/reports', { method: 'POST', headers: auth(t), body: JSON.stringify({ targetType: 'post', targetId: w.postId, reason: 'spam' }) }), denied: 404, memberOk: [200, 201] },
  { name: 'POST signalement de commentaire (global)', call: (w, t) => app.request('/api/reports', { method: 'POST', headers: auth(t), body: JSON.stringify({ targetType: 'comment', targetId: w.commentId, reason: 'spam' }) }), denied: 404, memberOk: [200, 201] },
];

describe('matrice d’accès croisés — tribu privée', () => {
  for (const s of surfaces) {
    it(`${s.name} : refusé à ${DENIED.join(', ')}`, async () => {
      for (const actor of DENIED) {
        const res = await s.call(world, world.tokens[actor]);
        expect(res.status, `${actor} sur « ${s.name} »`).toBe(s.denied);
      }
    });

    it(`${s.name} : un membre n’est pas bloqué`, async () => {
      const res = await s.call(world, world.tokens.member);
      expect(s.memberOk, `statut ${res.status}`).toContain(res.status);
    });
  }

  it('listes : le post n’apparaît dans aucun fil, recherche, signet ni Explorer pour un non-membre', async () => {
    const title = (await json<{ title: string }>(await app.request(`/api/posts/${world.postId}`, { headers: auth(world.tokens.owner) }))).title;
    for (const actor of DENIED) {
      const t = world.tokens[actor];
      for (const filter of ['for-you', 'popular', 'new', 'following', 'tribes']) {
        const feed = await json<{ posts: Array<{ id: string }> }>(await app.request(`/api/feed?filter=${filter}`, { headers: auth(t) }));
        expect(feed.posts.map((p) => p.id), `${actor} fil ${filter}`).not.toContain(world.postId);
      }
      const search = await json<{ posts: Array<{ id: string }>; tribes: Array<{ id: string }> }>(await app.request(`/api/search?q=${encodeURIComponent(title)}&type=all`, { headers: auth(t) }));
      expect(search.posts.map((p) => p.id), `${actor} recherche`).not.toContain(world.postId);
      expect(search.tribes.map((x) => x.id), `${actor} recherche tribus`).not.toContain(world.tribeId);
      const saves = await json<{ posts: Array<{ id: string }> } | Array<{ id: string }>>(await app.request('/api/posts/saves/list', { headers: auth(t) }));
      const saved = Array.isArray(saves) ? saves : saves.posts;
      expect(saved.map((p) => p.id), `${actor} signets`).not.toContain(world.postId);
      const explore = JSON.stringify(await json<unknown>(await app.request('/api/explore', { headers: auth(t) })));
      expect(explore, `${actor} explorer`).not.toContain(world.tribeId);
      const list = await json<{ tribes: Array<{ id: string }> }>(await app.request('/api/tribes?limit=50', { headers: auth(t) }));
      expect(list.tribes.map((x) => x.id), `${actor} liste des tribus`).not.toContain(world.tribeId);
    }
  });

  it('un membre retrouve le post dans le fil d’accueil des tribus', async () => {
    const feed = await json<{ posts: Array<{ id: string }> }>(await app.request('/api/feed?filter=tribes', { headers: auth(world.tokens.member) }));
    expect(feed.posts.map((p) => p.id)).toContain(world.postId);
  });

  it('un repost vers une tribu publique est refusé même pour un membre', async () => {
    const publicTribe = (await json<{ id: string }>(await createTribe(world.tokens.member))).id;
    const res = await app.request('/api/posts', { method: 'POST', headers: auth(world.tokens.member), body: JSON.stringify({ type: 'Repost', title: 'Repost', tribeId: publicTribe, originalPostId: world.postId }) });
    expect(res.status).toBe(403);
  });

  it('un ex-membre réapprouvé retrouve l’accès (dernier test : il modifie le monde)', async () => {
    const t = world.tokens.leaver;
    await app.request(`/api/tribes/${world.tribeId}/join`, { method: 'POST', headers: auth(t) });
    await app.request(`/api/tribes/${world.tribeId}/join-requests/${await meId(t)}/approve`, { method: 'POST', headers: auth(world.tokens.owner) });
    expect((await app.request(`/api/posts/${world.postId}`, { headers: auth(t) })).status).toBe(200);
  });
});
