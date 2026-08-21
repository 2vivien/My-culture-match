import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp } from '../../src/app';
import { AppError } from '../../src/shared/utils/AppError';

const app = createApp();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App Hono — infra', () => {
  it('répond 200 sur /health/live', async () => {
    const res = await app.request('/health/live');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });

  it('répond 404 JSON sur une route inconnue', async () => {
    const res = await app.request('/route/inconnue');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('injecte un X-Request-Id dans la réponse', async () => {
    const res = await app.request('/health/live');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('respecte un X-Request-Id entrant', async () => {
    const res = await app.request('/health/live', {
      headers: { 'x-request-id': 'req-1234-test' },
    });
    expect(res.headers.get('x-request-id')).toBe('req-1234-test');
  });

  it('répond 204 sur une requête OPTIONS (preflight CORS)', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(res.status).toBe(204);
  });

  it('n’autorise pas une origine inconnue', async () => {
    const res = await app.request('/health/live', {
      headers: { Origin: 'http://evil.example.com' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('Error handler', () => {
  it('formate une AppError en JSON avec son statut', async () => {
    const testApp = createApp();
    testApp.get('/boom', () => {
      throw AppError.notFound('Ressource introuvable');
    });
    const res = await testApp.request('/boom');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Ressource introuvable');
  });
});
