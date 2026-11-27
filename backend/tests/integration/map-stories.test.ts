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

async function login(prefix = 'sto'): Promise<string> {
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

const exact = { latitude: 6.371234, longitude: 2.391178 };
const patchSettings = (token: string, body: Record<string, unknown>) =>
  app.request('/api/location/settings', { method: 'PATCH', headers: auth(token), body: JSON.stringify(body) });
const createStory = (token: string, extra: Record<string, unknown> = {}) =>
  app.request('/api/stories', { method: 'POST', headers: auth(token), body: JSON.stringify({ mediaUrl: 'https://example.com/story.jpg', type: 'image', ...extra }) });
const mapStories = async (token: string) =>
  (await json<{ stories: Array<{ id: string; latitude: number; longitude: number; placeLabel: string | null }> }>(
    await app.request(`/api/location/stories?lat=${exact.latitude}&lon=${exact.longitude}`, { headers: auth(token) }),
  )).stories;

async function sharingAuthor(visibility: string): Promise<string> {
  const t = await login();
  expect((await patchSettings(t, { sharingEnabled: true, consent: true, visibility })).status).toBe(200);
  return t;
}

describe('stories géolocalisées', () => {
  it('refuse un lieu quand le partage de position est désactivé', async () => {
    const t = await login();
    const res = await createStory(t, { place: exact });
    expect(res.status).toBe(403);
    expect((await json<{ error: { code: string } }>(res)).error.code).toBe('STORY_PLACE_SHARING_OFF');
  });

  it('refuse un lieu quand la visibilité est « personne »', async () => {
    const t = await sharingAuthor('nobody');
    const res = await createStory(t, { place: exact });
    expect(res.status).toBe(400);
    expect((await json<{ error: { code: string } }>(res)).error.code).toBe('STORY_PLACE_VISIBILITY_NOBODY');
  });

  it('ne stocke jamais le point exact : la story renvoie le centre de la cellule', async () => {
    const t = await sharingAuthor('everyone');
    const res = await createStory(t, { place: { ...exact, label: '  Marché   Dantokpa ' } });
    expect(res.status).toBe(201);
    const { place } = await json<{ place: { latitude: number; longitude: number; label: string } }>(res);
    expect(place.label).toBe('Marché Dantokpa');
    expect(place.latitude).not.toBe(exact.latitude);
    expect(place.longitude).not.toBe(exact.longitude);
    expect(Math.abs(place.latitude - exact.latitude)).toBeLessThanOrEqual(0.0051);
    expect(Math.abs(place.longitude - exact.longitude)).toBeLessThanOrEqual(0.0051);
  });

  it('un inconnu voit la story d’un auteur « tout le monde », pas celle d’un auteur « amis »', async () => {
    const open = await sharingAuthor('everyone');
    const closed = await sharingAuthor('friends');
    const openStory = (await json<{ id: string }>(await createStory(open, { place: exact }))).id;
    const closedStory = (await json<{ id: string }>(await createStory(closed, { place: exact }))).id;

    const stranger = await login();
    const ids = (await mapStories(stranger)).map((s) => s.id);
    expect(ids).toContain(openStory);
    expect(ids).not.toContain(closedStory);
  });

  it('le mode fantôme masque les marqueurs, et ils reviennent quand il est levé', async () => {
    const author = await sharingAuthor('everyone');
    const storyId = (await json<{ id: string }>(await createStory(author, { place: exact }))).id;
    const stranger = await login();
    expect((await mapStories(stranger)).map((s) => s.id)).toContain(storyId);

    await patchSettings(author, { ghostMode: true });
    expect((await mapStories(stranger)).map((s) => s.id)).not.toContain(storyId);
    await patchSettings(author, { ghostMode: false });
    expect((await mapStories(stranger)).map((s) => s.id)).toContain(storyId);
  });

  it('couper le partage efface le lieu de la story, qui ne revient pas à la réactivation', async () => {
    const author = await sharingAuthor('everyone');
    const storyId = (await json<{ id: string }>(await createStory(author, { place: exact }))).id;
    const stranger = await login();
    expect((await mapStories(stranger)).map((s) => s.id)).toContain(storyId);

    await patchSettings(author, { sharingEnabled: false });
    expect((await mapStories(stranger)).map((s) => s.id)).not.toContain(storyId);
    await patchSettings(author, { sharingEnabled: true, consent: true });
    expect((await mapStories(stranger)).map((s) => s.id)).not.toContain(storyId);
    const mine = await json<Array<{ id: string; place: unknown }>>(await app.request('/api/stories', { headers: auth(author) }));
    expect(mine.find((s) => s.id === storyId)?.place).toBeNull();
  });

  it('GET /stories ne révèle le lieu d’une story qu’à son auteur', async () => {
    const author = await sharingAuthor('everyone');
    await createStory(author, { place: exact });
    const mine = await json<Array<{ isMine: boolean; place: unknown }>>(await app.request('/api/stories', { headers: auth(author) }));
    expect(mine.find((s) => s.isMine)?.place).not.toBeNull();
  });

  it('sans origine ni position partagée, aucun marqueur ; sans authentification, 401', async () => {
    const t = await login();
    const none = await json<{ stories: unknown[] }>(await app.request('/api/location/stories', { headers: auth(t) }));
    expect(none.stories).toEqual([]);
    expect((await app.request('/api/location/stories')).status).toBe(401);
  });
});
