import { describe, it, expect, vi, afterEach } from 'vitest';
import { createApp } from '../../src/app';
import * as database from '../../src/infrastructure/database';
import * as redisInfra from '../../src/infrastructure/redis';
import * as sentryModule from '../../src/infrastructure/monitoring/sentry';

const app = createApp();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Health checks (MP18)', () => {
  it('GET /health → 200 quand la DB répond', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('myculturematch-backend');
  });

  it('GET /health → 503 quand la DB est down', async () => {
    vi.spyOn(database, 'checkDatabase').mockRejectedValueOnce(new Error('connection refused'));
    const res = await app.request('/health');
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('error');
  });

  it('GET /health/ready → 200 dégradé si une dépendance est KO', async () => {
    vi.spyOn(database, 'checkDatabase').mockRejectedValueOnce(new Error('db down'));
    vi.spyOn(redisInfra, 'checkRedis').mockRejectedValueOnce(new Error('redis down'));
    const res = await app.request('/health/ready');
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string; checks: Record<string, string> };
    expect(body.status).toBe('degraded');
    expect(body.checks.database).toBe('error');
    expect(body.checks.redis).toBe('error');
    expect(body.checks.meilisearch).toBe('ok');
  });

  it('GET /health/live → 200 (liveness)', async () => {
    const res = await app.request('/health/live');
    expect(res.status).toBe(200);
  });
});

describe('Métriques Prometheus (MP18)', () => {
  it('GET /metrics expose le format Prometheus texte', async () => {
    // Une requête HTTP déclenche le middleware de comptage
    await app.request('/health/live');
    const res = await app.request('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('http_requests_total');
    expect(text).toContain('http_request_duration_seconds');
    expect(text).toContain('posts_created_total');
  });
});

describe('Capture d’erreurs Sentry (MP18)', () => {
  it('Sentry est désactivé par défaut (no-op sans SENTRY_DSN)', () => {
    expect(sentryModule.isSentryEnabled()).toBe(false);
    // Ne doit pas lever
    expect(() => sentryModule.captureError(new Error('test'))).not.toThrow();
  });

  it('une erreur non gérée est capturée (captureError appelé) et renvoie 500 JSON', async () => {
    const spy = vi.spyOn(sentryModule, 'captureError').mockImplementation(() => {});
    const testApp = createApp();
    testApp.get('/explose', () => {
      throw new Error('boom inattendu');
    });
    const res = await testApp.request('/explose', {
      headers: { 'x-request-id': 'req-sentry-1234' },
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(spy).toHaveBeenCalledTimes(1);
    const [err, context] = spy.mock.calls[0] as [Error, { requestId: string }];
    expect(err.message).toBe('boom inattendu');
    expect(context.requestId).toBe('req-sentry-1234');
  });
});
