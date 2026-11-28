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

async function login(prefix = 'trb'): Promise<string> {
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

describe('POST /api/tribes — création', () => {
  it('crée une tribu avec règles et rôle owner (201)', async () => {
    const token = await login();
    const res = await createTribe(token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      role: string;
      joined: boolean;
      membersCount: number;
      rules: unknown[];
      moderators: Array<{ role: string }>;
    };
    expect(body.role).toBe('owner');
    expect(body.joined).toBe(true);
    expect(body.membersCount).toBe(1);
    expect(body.rules).toHaveLength(2);
    expect(body.moderators[0]?.role).toBe('owner');
  });

  it('refuse un tag invalide (400)', async () => {
    const token = await login();
    const res = await createTribe(token, { tag: 'PAS_OK!' });
    expect(res.status).toBe(400);
  });

  it('refuse moins de 2 règles (400)', async () => {
    const token = await login();
    const res = await createTribe(token, { rules: [{ title: 'Seule', description: 'règle unique' }] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tribes/:id — détail + visiteurs', () => {
  it('incrémente les visiteurs à chaque GET', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };

    const first = await app.request(`/api/tribes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(((await first.json()) as { visitorsCount: number }).visitorsCount).toBe(1);

    const second = await app.request(`/api/tribes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(((await second.json()) as { visitorsCount: number }).visitorsCount).toBe(2);
  });
});

describe('GET /api/tribes — liste', () => {
  it('recherche par tag et pagine par cursor', async () => {
    const token = await login();
    const created = (await (await createTribe(token)).json()) as { id: string; tag: string };

    const res = await app.request(`/api/tribes?search=${created.tag}&limit=5`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tribes: Array<{ id: string }>; nextCursor: string | null };
    expect(body.tribes.map((t) => t.id)).toContain(created.id);
  });
});

describe('Join / Leave', () => {
  it('rejoint puis quitte (compteur à jour)', async () => {
    const tokenA = await login();
    const tokenB = await login();
    const { id } = (await (await createTribe(tokenA)).json()) as { id: string };

    const join = await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${tokenB}` } });
    const joinBody = (await join.json()) as { joined: boolean; membersCount: number };
    expect(joinBody.joined).toBe(true);
    expect(joinBody.membersCount).toBe(2);

    const leave = await app.request(`/api/tribes/${id}/leave`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenB}` } });
    expect(((await leave.json()) as { left: boolean }).left).toBe(true);

    const leaveAgain = await app.request(`/api/tribes/${id}/leave`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenB}` } });
    expect(((await leaveAgain.json()) as { left: boolean }).left).toBe(false);
  });

  it('interdit à l’owner de quitter (400)', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };
    const res = await app.request(`/api/tribes/${id}/leave`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/tribes/:id', () => {
  it('modifie la tribu par l’owner (200)', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };

    const res = await app.request(`/api/tribes/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description: 'Nouvelle description' }),
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { description: string }).description).toBe('Nouvelle description');
  });

  it('refuse à un non-owner (403)', async () => {
    const tokenA = await login();
    const tokenB = await login();
    const { id } = (await (await createTribe(tokenA)).json()) as { id: string };

    const res = await app.request(`/api/tribes/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'Hijack' }),
    });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/tribes/:id', () => {
  it('suppression par le créateur (200)', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };
    const res = await app.request(`/api/tribes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
  });

  it('refuse la suppression par un tiers (403)', async () => {
    const tokenA = await login();
    const tokenB = await login();
    const { id } = (await (await createTribe(tokenA)).json()) as { id: string };
    const res = await app.request(`/api/tribes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenB}` } });
    expect(res.status).toBe(403);
  });
});

describe('Posts de tribu', () => {
  it('publication + liste paginée', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };

    const post = await app.request(`/api/tribes/${id}/posts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'Text', title: 'Ma première tradition', body: 'Une danse du sud' }),
    });
    expect(post.status).toBe(201);
    const { id: postId } = (await post.json()) as { id: string };

    const list = await app.request(`/api/tribes/${id}/posts?limit=5`, { headers: { Authorization: `Bearer ${token}` } });
    const body = (await list.json()) as { posts: Array<{ id: string }> };
    expect(body.posts.map((p) => p.id)).toContain(postId);
  });

  it('refuse à un non-membre de poster dans la tribu (403)', async () => {
    const tokenA = await login();
    const tokenB = await login();
    const { id } = (await (await createTribe(tokenA)).json()) as { id: string };

    const res = await app.request(`/api/tribes/${id}/posts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ type: 'Text', title: 'Intrusion', body: 'Contenu' }),
    });
    expect(res.status).toBe(403);
  });
});

describe('Votes & pin', () => {
  it('upvote toggle sur un post (score 1 puis 0)', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };
    const { id: postId } = (await (
      await app.request(`/api/tribes/${id}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'Text', title: 'Titre vote', body: 'Contenu' }),
      })
    ).json()) as { id: string };

    const first = await app.request(`/api/tribu/posts/${postId}/upvote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value: 1 }),
    });
    expect(((await first.json()) as { myVote: number; score: number }).score).toBe(1);

    const second = await app.request(`/api/tribu/posts/${postId}/upvote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value: 1 }),
    });
    expect(((await second.json()) as { myVote: number; score: number }).score).toBe(0);
  });

  it('pin par l’owner (200), refusé à un non-membre (403)', async () => {
    const tokenA = await login();
    const tokenB = await login();
    const { id } = (await (await createTribe(tokenA)).json()) as { id: string };
    const { id: postId } = (await (
      await app.request(`/api/tribes/${id}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ type: 'Text', title: 'Titre pin', body: 'Contenu' }),
      })
    ).json()) as { id: string };

    const pin = await app.request(`/api/tribes/${id}/posts/${postId}/pin`, { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } });
    expect(pin.status).toBe(200);

    const denied = await app.request(`/api/tribes/${id}/posts/${postId}/pin`, { method: 'POST', headers: { Authorization: `Bearer ${tokenB}` } });
    expect(denied.status).toBe(403);
  });

  it('le post épinglé apparaît en haut de la liste', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };

    const firstPost = (await (
      await app.request(`/api/tribes/${id}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'Text', title: 'Premier', body: 'Contenu 1' }),
      })
    ).json()) as { id: string };

    const pinnedPost = (await (
      await app.request(`/api/tribes/${id}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'Text', title: 'Épinglé', body: 'Contenu 2' }),
      })
    ).json()) as { id: string };

    const pin = await app.request(`/api/tribes/${id}/posts/${pinnedPost.id}/pin`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    expect(pin.status).toBe(200);

    const list = await app.request(`/api/tribes/${id}/posts`, { headers: { Authorization: `Bearer ${token}` } });
    const posts = ((await list.json()) as { posts: Array<{ id: string }> }).posts;
    expect(posts[0]?.id).toBe(pinnedPost.id);
    expect(posts.map((p) => p.id)).toContain(firstPost.id);
  });
});

describe('Unicité name / tag', () => {
  it('refuse un tag dupliqué (409)', async () => {
    const token = await login();
    const { tag } = (await (await createTribe(token)).json()) as { tag: string };
    const res = await createTribe(token, { name: 'Autre nom', tag });
    expect(res.status).toBe(409);
  });

  it('refuse un nom dupliqué (409)', async () => {
    const token = await login();
    const created = (await (await createTribe(token)).json()) as { name: string; tag: string };
    const res = await createTribe(token, { name: created.name, tag: `trb-${unique()}` });
    expect(res.status).toBe(409);
  });
});

async function me(token: string): Promise<{ id: string }> {
  const res = await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
  return (await res.json()) as { id: string };
}

describe('Modérateurs', () => {
  it('promotion puis rétrogradation par l’owner (200)', async () => {
    const tokenOwner = await login();
    const tokenMember = await login();
    const { id } = (await (await createTribe(tokenOwner)).json()) as { id: string };
    const memberId = (await me(tokenMember)).id;

    await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${tokenMember}` } });

    const promote = await app.request(`/api/tribes/${id}/moderators`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenOwner}` },
      body: JSON.stringify({ userId: memberId }),
    });
    expect(promote.status).toBe(200);
    expect(((await promote.json()) as { role: string }).role).toBe('moderator');

    const demote = await app.request(`/api/tribes/${id}/moderators/${memberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenOwner}` },
    });
    expect(demote.status).toBe(200);
    expect(((await demote.json()) as { role: string }).role).toBe('member');
  });

  it('refuse la promotion d’un non-membre (400)', async () => {
    const tokenOwner = await login();
    const tokenMember = await login();
    const { id } = (await (await createTribe(tokenOwner)).json()) as { id: string };
    const memberId = (await me(tokenMember)).id;

    const res = await app.request(`/api/tribes/${id}/moderators`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenOwner}` },
      body: JSON.stringify({ userId: memberId }),
    });
    expect(res.status).toBe(400);
  });

  it('refuse la promotion à un non-owner (403)', async () => {
    const tokenOwner = await login();
    const tokenIntruder = await login();
    const { id } = (await (await createTribe(tokenOwner)).json()) as { id: string };
    const intruderId = (await me(tokenIntruder)).id;

    await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${tokenIntruder}` } });

    const res = await app.request(`/api/tribes/${id}/moderators`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenIntruder}` },
      body: JSON.stringify({ userId: intruderId }),
    });
    expect(res.status).toBe(403);
  });
});

describe('Règles de tribu', () => {
  it('ajoute, modifie puis supprime une règle (renumérotation)', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };

    const add = await app.request(`/api/tribes/${id}/rules`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Nouvelle règle', description: 'Description' }),
    });
    expect(add.status).toBe(201);
    const added = (await add.json()) as { id: string; number: number; title: string };
    expect(added.number).toBe(3);

    const patch = await app.request(`/api/tribes/${id}/rules/${added.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Modifiée' }),
    });
    expect(patch.status).toBe(200);
    expect(((await patch.json()) as { title: string }).title).toBe('Modifiée');

    const del = await app.request(`/api/tribes/${id}/rules/${added.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(del.status).toBe(200);

    const list = await app.request(`/api/tribes/${id}/rules`, { headers: { Authorization: `Bearer ${token}` } });
    const rules = ((await list.json()) as { rules: Array<{ number: number }> }).rules;
    expect(rules).toHaveLength(2);
    expect(rules.map((r) => r.number)).toEqual([1, 2]);
  });

  it('refuse la gestion des règles à un non-owner (403)', async () => {
    const tokenOwner = await login();
    const tokenMember = await login();
    const { id } = (await (await createTribe(tokenOwner)).json()) as { id: string };

    const res = await app.request(`/api/tribes/${id}/rules`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenMember}` },
      body: JSON.stringify({ title: 'Règle illégitime', description: 'Description' }),
    });
    expect(res.status).toBe(403);
  });
});

describe('Signalements', () => {
  it('interdit de signaler sa propre tribu (400)', async () => {
    const token = await login();
    const { id } = (await (await createTribe(token)).json()) as { id: string };
    const res = await app.request(`/api/tribes/${id}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: 'Contenu inapproprié' }),
    });
    expect(res.status).toBe(400);
  });

  it('signale une tribu puis la liste est visible par le modérateur', async () => {
    const tokenOwner = await login();
    const tokenMember = await login();
    const { id } = (await (await createTribe(tokenOwner)).json()) as { id: string };

    const report = await app.request(`/api/tribes/${id}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenMember}` },
      body: JSON.stringify({ reason: 'Contenu inapproprié' }),
    });
    expect(report.status).toBe(200);

    const denied = await app.request(`/api/tribes/${id}/reports`, { headers: { Authorization: `Bearer ${tokenMember}` } });
    expect(denied.status).toBe(403);

    const list = await app.request(`/api/tribes/${id}/reports`, { headers: { Authorization: `Bearer ${tokenOwner}` } });
    expect(list.status).toBe(200);
    const body = (await list.json()) as { reports: Array<{ targetType: string }> };
    expect(body.reports.map((r) => r.targetType)).toContain('tribe');
  });
});

describe('Sanctions de tribu (ban / mute)', () => {
  const post = (token: string, path: string, body: unknown) =>
    app.request(path, { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  const userIdOf = async (token: string) => ((await (await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })).json()) as { id: string }).id;

  async function seed() {
    const owner = await login();
    const member = await login();
    const { id } = (await (await createTribe(owner)).json()) as { id: string };
    await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${member}` } });
    return { owner, member, id, memberId: await userIdOf(member) };
  }

  it('un membre muet ne peut plus publier (403) mais reste membre', async () => {
    const { owner, member, id, memberId } = await seed();
    const res = await post(owner, `/api/tribes/${id}/sanctions`, { userId: memberId, kind: 'mute', days: 3 });
    expect(res.status).toBe(201);
    const attempt = await post(member, `/api/tribes/${id}/posts`, { type: 'Text', title: 'Je parle quand même', body: 'Contenu' });
    expect(attempt.status).toBe(403);
  });

  it('un membre banni est retiré de la tribu et ne peut pas la rejoindre', async () => {
    const { owner, member, id, memberId } = await seed();
    expect((await post(owner, `/api/tribes/${id}/sanctions`, { userId: memberId, kind: 'ban', reason: 'spam' })).status).toBe(201);
    const rejoin = await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${member}` } });
    expect(rejoin.status).toBe(403);
  });

  it('lever la sanction rétablit l’accès', async () => {
    const { owner, member, id, memberId } = await seed();
    await post(owner, `/api/tribes/${id}/sanctions`, { userId: memberId, kind: 'ban' });
    const lift = await app.request(`/api/tribes/${id}/sanctions/${memberId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${owner}` } });
    expect(lift.status).toBe(200);
    const rejoin = await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${member}` } });
    expect(rejoin.status).toBe(200);
  });

  it('un simple membre ne peut ni sanctionner ni lister les sanctions (403)', async () => {
    const { owner, member, id } = await seed();
    const ownerId = await userIdOf(owner);
    expect((await post(member, `/api/tribes/${id}/sanctions`, { userId: ownerId, kind: 'mute' })).status).toBe(403);
    expect((await app.request(`/api/tribes/${id}/sanctions`, { headers: { Authorization: `Bearer ${member}` } })).status).toBe(403);
  });

  it('l’owner ne peut pas être sanctionné', async () => {
    const { owner, id } = await seed();
    const ownerId = await userIdOf(owner);
    expect((await post(owner, `/api/tribes/${id}/sanctions`, { userId: ownerId, kind: 'ban' })).status).toBe(403);
  });
});

describe('Sanctions de tribu — levée', () => {
  it('un modérateur ne peut pas lever la sanction d’un autre modérateur (403), l’owner le peut', async () => {
    const j = (t: string, body?: unknown, method = 'POST') => ({ method, headers: { 'content-type': 'application/json', Authorization: `Bearer ${t}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const me = async (t: string) => ((await (await app.request('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })).json()) as { id: string }).id;
    const owner = await login();
    const modA = await login();
    const modB = await login();
    const { id } = (await (await createTribe(owner)).json()) as { id: string };
    for (const t of [modA, modB]) await app.request(`/api/tribes/${id}/join`, j(t));
    const [aId, bId] = [await me(modA), await me(modB)];
    for (const uid of [aId, bId]) await app.request(`/api/tribes/${id}/moderators`, j(owner, { userId: uid }));

    expect((await app.request(`/api/tribes/${id}/sanctions`, j(owner, { userId: bId, kind: 'mute' }))).status).toBe(201);
    expect((await app.request(`/api/tribes/${id}/sanctions/${bId}`, j(modA, undefined, 'DELETE'))).status).toBe(403);
    expect((await app.request(`/api/tribes/${id}/sanctions/${bId}`, j(owner, undefined, 'DELETE'))).status).toBe(200);
  });
});

describe('Tri des posts de tribu (sort=hot|top|controversial|new)', () => {
  const json = (token: string, body: unknown) => ({
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  async function seed() {
    const owner = await login();
    const voterA = await login();
    const voterB = await login();
    const { id } = (await (await createTribe(owner)).json()) as { id: string };
    for (const t of [voterA, voterB]) await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } });
    const mk = async (title: string) =>
      ((await (await app.request(`/api/tribes/${id}/posts`, json(owner, { type: 'Text', title, body: 'Contenu' }))).json()) as { id: string }).id;
    const vote = (token: string, postId: string, value: 1 | -1) => app.request(`/api/tribu/posts/${postId}/upvote`, json(token, { value }));
    return { owner, voterA, voterB, id, mk, vote };
  }
  const order = async (token: string, id: string, query: string) =>
    (((await (await app.request(`/api/tribes/${id}/posts?${query}`, { headers: { Authorization: `Bearer ${token}` } })).json()) as { posts: Array<{ id: string }> }).posts).map((p) => p.id);

  it('top : le post le mieux noté vient en premier', async () => {
    const { owner, voterA, voterB, id, mk, vote } = await seed();
    const low = await mk('Bas');
    const high = await mk('Haut');
    await vote(voterA, high, 1); await vote(voterB, high, 1); await vote(voterA, low, -1);
    expect((await order(owner, id, 'sort=top'))[0]).toBe(high);
  });

  it('controversial : camps équilibrés avant consensus', async () => {
    const { owner, voterA, voterB, id, mk, vote } = await seed();
    const consensus = await mk('Consensus');
    const split = await mk('Partagé');
    await vote(voterA, consensus, 1); await vote(voterB, consensus, 1); await vote(owner, consensus, 1);
    await vote(voterA, split, 1); await vote(voterB, split, -1);
    expect((await order(owner, id, 'sort=controversial'))[0]).toBe(split);
  });

  it('new (défaut) : le plus récent en premier', async () => {
    const { owner, id, mk } = await seed();
    await mk('Ancien');
    const recent = await mk('Récent');
    expect((await order(owner, id, ''))[0]).toBe(recent);
  });

  it('un post épinglé reste en tête quel que soit le tri', async () => {
    const { owner, voterA, id, mk, vote } = await seed();
    const pinned = await mk('Épinglé');
    const popular = await mk('Populaire');
    await vote(voterA, popular, 1);
    await app.request(`/api/tribes/${id}/posts/${pinned}/pin`, { method: 'POST', headers: { Authorization: `Bearer ${owner}` } });
    for (const sort of ['hot', 'top', 'controversial']) expect((await order(owner, id, `sort=${sort}`))[0]).toBe(pinned);
  });

  it('refuse un tri inconnu (400)', async () => {
    const { owner, id } = await seed();
    const res = await app.request(`/api/tribes/${id}/posts?sort=bogus`, { headers: { Authorization: `Bearer ${owner}` } });
    expect(res.status).toBe(400);
  });
});
