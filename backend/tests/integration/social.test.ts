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

async function onboardUser(prefix: string): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.30.${Math.floor(Math.random() * 200)}.1`;
  await app.request('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email }),
  });
  const code = await getOtpCode(email);
  const verify = await app.request('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, code }),
  });
  const { token } = (await verify.json()) as { token: string };

  const payload = {
    email,
    name: 'Awa',
    username: `awa${unique()}`,
    avatarSeed: 'seed',
    gender: 'female',
    seeking: 'friendship',
    birthdate: '1995-06-15',
    roots: { country: 'Bénin', region: 'Atlantique', ethnicity: 'Fon', village: 'Abomey' },
    languages: ['fr', 'fon'],
    intention: 'dating',
    acceptedTermsAt: new Date().toISOString(),
  };
  const res = await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  expect(res.status).toBe(201);
  const me = await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()) as { id: string };
  return { token, userId: body.id };
}

const authed = (token: string, method = 'GET') => ({
  method,
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
});
const authedJson = (token: string, body: unknown) => ({ ...authed(token, 'POST'), body: JSON.stringify(body) });

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

describe('MP10 — Messagerie', () => {
  it('crée une conversation 1:1 et envoie un message', async () => {
    const a = await onboardUser('msg');
    const b = await onboardUser('msg');

    const create = await app.request('/api/conversations', authedJson(a.token, { participantId: b.userId }));
    expect(create.status).toBe(201);
    const conversation = (await create.json()) as { id: string };

    const send = await app.request(`/api/conversations/${conversation.id}/messages`, authedJson(a.token, { text: 'Salut !' }));
    expect(send.status).toBe(201);
    const message = (await send.json()) as { id: string; text: string; senderId: string };
    expect(message.text).toBe('Salut !');
    expect(message.senderId).toBe(a.userId);

    const list = await app.request(`/api/conversations/${conversation.id}/messages`, authed(a.token));
    expect(list.status).toBe(200);
    const { messages, nextCursor } = (await list.json()) as { messages: { text: string }[]; nextCursor: string | null };
    expect(messages).toHaveLength(1);
    expect(messages[0]?.text).toBe('Salut !');
    expect(nextCursor).toBeNull();
  });

  it('refuse l’envoi à un non-participant (403)', async () => {
    const a = await onboardUser('msg');
    const b = await onboardUser('msg');
    const c = await onboardUser('msg');

    const create = await app.request('/api/conversations', authedJson(a.token, { participantId: b.userId }));
    const conversation = (await create.json()) as { id: string };

    const send = await app.request(`/api/conversations/${conversation.id}/messages`, authedJson(c.token, { text: 'intrus' }));
    expect(send.status).toBe(403);
  });

  it('liste les conversations et compte les non-lus après lecture', async () => {
    const a = await onboardUser('msg');
    const b = await onboardUser('msg');

    const create = await app.request('/api/conversations', authedJson(a.token, { participantId: b.userId }));
    const conversation = (await create.json()) as { id: string };

    await app.request(`/api/conversations/${conversation.id}/messages`, authedJson(a.token, { text: 'un' }));
    await app.request(`/api/conversations/${conversation.id}/messages`, authedJson(a.token, { text: 'deux' }));

    const list = await app.request('/api/conversations', authed(b.token));
    const conversations = (await list.json()) as { id: string; unreadCount: number }[];
    const mine = conversations.find((x) => x.id === conversation.id);
    expect(mine?.unreadCount).toBe(2);

    await app.request(`/api/conversations/${conversation.id}/read`, authed(b.token, 'POST'));
    const after = await app.request('/api/conversations', authed(b.token));
    const afterBody = (await after.json()) as { id: string; unreadCount: number }[];
    expect(afterBody.find((x) => x.id === conversation.id)?.unreadCount).toBe(0);
  });

  it('toggle notifications (cloche)', async () => {
    const a = await onboardUser('msg');
    const b = await onboardUser('msg');
    const create = await app.request('/api/conversations', authedJson(a.token, { participantId: b.userId }));
    const conversation = (await create.json()) as { id: string };

    const res = await app.request(`/api/messages/${conversation.id}/notifications`, authed(a.token, 'POST'));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { notificationsEnabled: boolean }).notificationsEnabled).toBe(false);
  });
});

describe('MP9 — Love / Matching', () => {
  it('candidats : profil incomplet exclu', async () => {
    const a = await onboardUser('love');
    const b = await onboardUser('love');

    const candidates = await app.request('/api/love/matches', authed(a.token));
    expect(candidates.status).toBe(200);
    const list = (await candidates.json()) as { id: string }[];
    expect(list.some((x) => x.id === b.userId)).toBe(false);
  });

  it('swipe like mutuel → match + conversation créée', async () => {
    const a = await onboardUser('love');
    const b = await onboardUser('love');

    const aSwipes = await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));
    expect(aSwipes.status).toBe(200);
    expect(((await aSwipes.json()) as { matched: boolean }).matched).toBe(false);

    const bSwipes = await app.request('/api/love/swipe', authedJson(b.token, { userId: a.userId, action: 'like' }));
    expect(bSwipes.status).toBe(200);
    const result = (await bSwipes.json()) as { matched: boolean; conversationId?: string };
    expect(result.matched).toBe(true);
    expect(result.conversationId).toBeDefined();

    const list = await app.request('/api/conversations', authed(b.token));
    const conversations = (await list.json()) as { id: string }[];
    expect(conversations.some((x) => x.id === result.conversationId)).toBe(true);
  });

  it('swipe pass → pas de resuggestion (candidat retiré)', async () => {
    const a = await onboardUser('love');
    const b = await onboardUser('love');

    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'pass' }));
    const res = await app.request('/api/love/matches', authed(a.token));
    const list = (await res.json()) as { id: string }[];
    expect(list.some((x) => x.id === b.userId)).toBe(false);
  });

  it('refuse un double swipe (409)', async () => {
    const a = await onboardUser('love');
    const b = await onboardUser('love');
    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));
    const res = await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));
    expect(res.status).toBe(409);
  });
});

describe('MP8 — Connexions', () => {
  it('envoie une demande puis accepte → compagnon + notification', async () => {
    const a = await onboardUser('con');
    const b = await onboardUser('con');

    const request = await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));
    expect(request.status).toBe(200);

    const requests = await app.request('/api/connections/requests', authed(b.token));
    const { connections: list } = (await requests.json()) as { connections: { profile: { id: string }; status: string }[] };
    const mine = list.find((x) => x.profile.id === a.userId);
    expect(mine?.status).toBe('request');

    const accept = await app.request(`/api/requests/${a.userId}/accept`, authed(b.token, 'POST'));
    expect(accept.status).toBe(200);

    const companions = await app.request('/api/connections/companions', authed(a.token));
    const { connections: companionList } = (await companions.json()) as { connections: { profile: { id: string } }[] };
    expect(companionList.some((x) => x.profile.id === b.userId)).toBe(true);
  });

  it('refuse une double demande simultanée (409)', async () => {
    const a = await onboardUser('con');
    const b = await onboardUser('con');

    await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));
    const second = await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));
    expect(second.status).toBe(409);
  });

  it('decline → pas de resuggestion (30j)', async () => {
    const a = await onboardUser('con');
    const b = await onboardUser('con');

    await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));
    await app.request(`/api/requests/${a.userId}/decline`, authed(b.token, 'POST'));

    const suggestions = await app.request('/api/connections/suggestions', authed(b.token));
    const list = (await suggestions.json()) as { suggestions: { profile: { id: string } }[] };
    expect(list.suggestions.some((x) => x.profile.id === a.userId)).toBe(false);
  });

  it('bloque un utilisateur → il disparaît des suggestions', async () => {
    const a = await onboardUser('con');
    const b = await onboardUser('con');

    await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));
    const block = await app.request(`/api/requests/${a.userId}/block`, authed(b.token, 'POST'));
    expect(block.status).toBe(200);

    const suggestions = await app.request('/api/connections/suggestions', authed(b.token));
    const list = (await suggestions.json()) as { suggestions: { profile: { id: string } }[] };
    expect(list.suggestions.some((x) => x.profile.id === a.userId)).toBe(false);
  });
});
