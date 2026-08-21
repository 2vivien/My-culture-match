import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { mediaBucket, minio } from '../../src/infrastructure/minio';
import { startMediaWorker, closeMediaQueue } from '../../src/modules/media/media.queue';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function login(): Promise<string> {
  const email = `up-${unique()}@example.com`;
  const ip = `10.40.${Math.floor(Math.random() * 200)}.1`;
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
  await closeMediaQueue();
  await redis.quit();
});

describe('POST /api/uploads/request', () => {
  it('retourne une URL présignée PUT pour un type autorisé', async () => {
    const token = await login();
    const res = await app.request('/api/uploads/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentType: 'image/png', size: 1024 * 50, purpose: 'avatar' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { uploadId: string; objectKey: string; presignedUrl: string; expiresIn: number };
    expect(body.uploadId).toBeTruthy();
    expect(body.objectKey.startsWith('avatar/')).toBe(true);
    expect(body.presignedUrl).toContain('X-Amz-Signature');
    expect(body.expiresIn).toBeGreaterThan(0);
  });

  it('refuse un MIME non autorisé (400)', async () => {
    const token = await login();
    const res = await app.request('/api/uploads/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentType: 'application/x-sh', size: 100, purpose: 'file' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('CONTENT_TYPE_NOT_ALLOWED');
  });

  it('refuse un avatar trop lourd (400)', async () => {
    const token = await login();
    const res = await app.request('/api/uploads/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentType: 'image/png', size: 6 * 1024 * 1024, purpose: 'avatar' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('refuse sans authentification (401)', async () => {
    const res = await app.request('/api/uploads/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentType: 'image/png', size: 100 }),
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/uploads/complete + media.process', () => {
  it('rejette un uploadId inconnu (400)', async () => {
    const token = await login();
    const res = await app.request('/api/uploads/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uploadId: 'inconnu-123' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejette le complete pour un upload d’un autre utilisateur (403)', async () => {
    const tokenA = await login();
    const tokenB = await login();

    const req = await app.request('/api/uploads/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ contentType: 'image/png', size: 100 }),
    });
    const { uploadId } = (await req.json()) as { uploadId: string };

    const res = await app.request('/api/uploads/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ uploadId }),
    });
    expect(res.status).toBe(403);
  });

  it('cycle complet : upload réel, complete, traitement et miniature', async () => {
    const token = await login();
    const png = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 15, g: 118, b: 110 } } }).png().toBuffer();

    const req = await app.request('/api/uploads/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contentType: 'image/png', size: png.length, purpose: 'post' }),
    });
    const { uploadId, presignedUrl } = (await req.json()) as { uploadId: string; presignedUrl: string };

    // Upload réel du fichier via l'URL présignée
    const put = await fetch(presignedUrl, { method: 'PUT', headers: { 'content-type': 'image/png' }, body: new Uint8Array(png) });
    expect(put.status).toBe(200);

    const complete = await app.request('/api/uploads/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uploadId }),
    });
    expect(complete.status).toBe(202);
    const completeBody = (await complete.json()) as { status: string; objectKey: string };
    expect(completeBody.status).toBe('processing');
    expect(completeBody.objectKey.startsWith('post/')).toBe(true);

    // Traitement via le worker
    startMediaWorker();

    let done = false;
    for (let i = 0; i < 20; i++) {
      const status = await app.request(`/api/uploads/${uploadId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await status.json()) as { status: string; thumbKey?: string; width?: number; height?: number };
      if (body.status === 'done') {
        expect(body.thumbKey).toBeTruthy();
        expect(body.width).toBe(800);
        expect(body.height).toBe(600);
        done = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(done).toBe(true);

    // La miniature existe réellement sur MinIO
    const statusRes = await app.request(`/api/uploads/${uploadId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { thumbKey } = (await statusRes.json()) as { thumbKey: string };
    const stat = await minio.statObject(mediaBucket, thumbKey);
    expect(stat.size).toBeGreaterThan(0);
  }, 30_000);
});
