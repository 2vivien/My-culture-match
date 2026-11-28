import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function login(prefix = 'pst'): Promise<string> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.50.${Math.floor(Math.random() * 200)}.1`;
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

async function createPost(token: string, overrides: Record<string, unknown> = {}) {
  const res = await app.request('/api/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      type: 'Text',
      title: 'La danse Gelede au Bénin #culture',
      body: 'Une post ancestrale que je souhaite partager avec la communauté.',
      tags: ['dance', 'benin'],
      ...overrides,
    }),
  });
  return res;
}

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await closeFeedFanoutQueue();
  await closeSearchQueue();
  await closeEmbeddingQueue();
  await redis.quit();
});

describe('POST /api/posts — création', () => {
  it('crée un post Text publié (201)', async () => {
    const token = await login();
    const res = await createPost(token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; status: string; tags: string[]; likes: number };
    expect(body.status).toBe('published');
    expect(body.tags).toContain('culture'); // hashtag extrait
    expect(body.likes).toBe(0);
  });

  it('refuse un post Images sans média (400)', async () => {
    const token = await login();
    const res = await createPost(token, { type: 'Images', mediaUrls: [] });
    expect(res.status).toBe(400);
  });

  it('accepte un post Images avec médias', async () => {
    const token = await login();
    const res = await createPost(token, {
      type: 'Images',
      mediaUrls: ['https://example.com/photo.jpg'],
      body: undefined,
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { mediaUrls: string[] };
    expect(body.mediaUrls).toHaveLength(1);
  });

  it('refuse une URL Link malveillante (400)', async () => {
    const token = await login();
    const res = await createPost(token, { type: 'Link', linkUrl: 'http://localhost:3000/x', body: undefined });
    expect(res.status).toBe(400);
  });

  it('refuse une URL file:// (400)', async () => {
    const token = await login();
    const res = await createPost(token, { type: 'Link', linkUrl: 'file:///etc/passwd', body: undefined });
    expect(res.status).toBe(400);
  });

  it('flag un post toxique (status=flagged)', async () => {
    const token = await login();
    const res = await createPost(token, { title: 'Je vais te tuer salope', body: 'contenu haineux' });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('flagged');
  });
});

describe('GET /api/posts/:id', () => {
  it('retourne le détail avec auteur et compteurs', async () => {
    const token = await login();
    const created = await createPost(token);
    const { id } = (await created.json()) as { id: string };

    const res = await app.request(`/api/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; author: { name: string }; likedByMe: boolean };
    expect(body.id).toBe(id);
    expect(body.author.name).toBeTruthy();
    expect(body.likedByMe).toBe(false);
  });

  it('retourne 404 pour un post inconnu', async () => {
    const token = await login();
    const res = await app.request('/api/posts/inconnu', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(404);
  });
});

describe('Interactions', () => {
  it('like/unlike toggle', async () => {
    const token = await login();
    const { id } = (await (await createPost(token)).json()) as { id: string };

    const like = await app.request(`/api/posts/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    expect(like.status).toBe(200);
    const liked = (await like.json()) as { liked: boolean; likes: number };
    expect(liked.liked).toBe(true);
    expect(liked.likes).toBe(1);

    const unlike = await app.request(`/api/posts/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const unliked = (await unlike.json()) as { liked: boolean };
    expect(unliked.liked).toBe(false);
  });

  it('commentaire + pagination cursor', async () => {
    const token = await login();
    const { id } = (await (await createPost(token)).json()) as { id: string };

    for (let i = 0; i < 5; i++) {
      const res = await app.request(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: `commentaire numéro ${i}` }),
      });
      expect(res.status).toBe(201);
    }

    const page1 = await app.request(`/api/posts/${id}/comments?limit=2`, { headers: { Authorization: `Bearer ${token}` } });
    const p1 = (await page1.json()) as { comments: unknown[]; nextCursor: string | null };
    expect(p1.comments).toHaveLength(2);
    expect(p1.nextCursor).toBeTruthy();

    const page2 = await app.request(`/api/posts/${id}/comments?limit=2&cursor=${encodeURIComponent(p1.nextCursor ?? '')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const p2 = (await page2.json()) as { comments: unknown[] };
    expect(p2.comments).toHaveLength(2);
  });

  it('partage unique (pas de doublon)', async () => {
    const token = await login();
    const { id } = (await (await createPost(token)).json()) as { id: string };
    await app.request(`/api/posts/${id}/share`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const second = await app.request(`/api/posts/${id}/share`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const body = (await second.json()) as { shared: boolean };
    expect(body.shared).toBe(false);
  });

  it('signet toggle + retrait', async () => {
    const token = await login();
    const { id } = (await (await createPost(token)).json()) as { id: string };
    const add = await app.request(`/api/posts/${id}/save`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    expect(((await add.json()) as { saved: boolean }).saved).toBe(true);
    const del = await app.request(`/api/posts/${id}/save`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(((await del.json()) as { saved: boolean }).saved).toBe(false);
  });

  it('commentaire sur post supprimé → 404', async () => {
    const token = await login();
    const { id } = (await (await createPost(token)).json()) as { id: string };
    await app.request(`/api/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });

    const res = await app.request(`/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: 'trop tard' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/posts/:id', () => {
  it('suppression par l’auteur (soft delete)', async () => {
    const token = await login();
    const { id } = (await (await createPost(token)).json()) as { id: string };

    const del = await app.request(`/api/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    expect(del.status).toBe(200);

    const get = await app.request(`/api/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(get.status).toBe(404);
  });

  it('refuse la suppression par un tiers (403)', async () => {
    const tokenA = await login();
    const tokenB = await login();
    const { id } = (await (await createPost(tokenA)).json()) as { id: string };

    const res = await app.request(`/api/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenB}` } });
    expect(res.status).toBe(403);
  });
});
