import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const scope = { setTag: vi.fn(), setUser: vi.fn() };
  return {
    env: { SENTRY_DSN: undefined as string | undefined, NODE_ENV: 'test' as string },
    scope,
    sentry: {
      init: vi.fn(),
      captureException: vi.fn(),
      withScope: vi.fn((cb: (s: typeof scope) => void) => cb(scope)),
    },
    logger: { info: vi.fn() },
  };
});
vi.mock('../../../src/config/env', () => ({ env: h.env }));
vi.mock('../../../src/middleware/logger', () => ({ logger: h.logger }));
vi.mock('@sentry/node', () => h.sentry);

type SentryModule = typeof import('../../../src/infrastructure/monitoring/sentry');
let mod: SentryModule;

// `enabled` est un état de module : on le recharge pour chaque test.
beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  h.env.SENTRY_DSN = undefined;
  h.env.NODE_ENV = 'test';
  mod = await import('../../../src/infrastructure/monitoring/sentry');
});

describe('Sentry', () => {
  it('reste désactivé sans DSN et ne capture rien', () => {
    mod.initSentry();
    expect(h.sentry.init).not.toHaveBeenCalled();
    expect(mod.isSentryEnabled()).toBe(false);
    mod.captureError(new Error('x'));
    expect(h.sentry.captureException).not.toHaveBeenCalled();
  });

  it('s’initialise avec le DSN, sans traces hors production', () => {
    h.env.SENTRY_DSN = 'https://dsn.example/1';
    mod.initSentry();
    expect(mod.isSentryEnabled()).toBe(true);
    expect(h.sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: 'https://dsn.example/1', environment: 'test', tracesSampleRate: 0, serverName: 'myculturematch-backend-test',
    }));
  });

  it('échantillonne 10 % des traces en production', () => {
    h.env.SENTRY_DSN = 'https://dsn.example/1';
    h.env.NODE_ENV = 'production';
    mod.initSentry();
    expect(h.sentry.init).toHaveBeenCalledWith(expect.objectContaining({ tracesSampleRate: 0.1 }));
  });

  it('capture l’erreur avec le contexte (requête et utilisateur)', () => {
    h.env.SENTRY_DSN = 'https://dsn.example/1';
    mod.initSentry();
    const err = new Error('boom');
    mod.captureError(err, { requestId: 'req-1', userId: 'u1', email: 'a@b.fr' });
    expect(h.scope.setTag).toHaveBeenCalledWith('requestId', 'req-1');
    expect(h.scope.setUser).toHaveBeenCalledWith({ id: 'u1', email: 'a@b.fr' });
    expect(h.sentry.captureException).toHaveBeenCalledWith(err);
  });

  it('capture sans contexte sans poser de tag ni d’utilisateur', () => {
    h.env.SENTRY_DSN = 'https://dsn.example/1';
    mod.initSentry();
    mod.captureError('texte');
    expect(h.scope.setTag).not.toHaveBeenCalled();
    expect(h.scope.setUser).not.toHaveBeenCalled();
    expect(h.sentry.captureException).toHaveBeenCalledWith('texte');
  });
});
