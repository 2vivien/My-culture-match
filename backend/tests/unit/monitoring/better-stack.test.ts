import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const envMock = vi.hoisted(() => ({ env: { BETTER_STACK_SOURCE_TOKEN: 'token-test' as string | undefined } }));
vi.mock('../../../src/config/env', () => envMock);

import { createBetterStackTransport } from '../../../src/infrastructure/monitoring/better-stack';

const fetchMock = vi.fn();
const write = (w: NodeJS.WritableStream, line: string) => new Promise<void>((resolve, reject) => {
  (w as import('node:stream').Writable).write(line, (err) => (err ? reject(err) : resolve()));
});

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
  envMock.env.BETTER_STACK_SOURCE_TOKEN = 'token-test';
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('createBetterStackTransport', () => {
  it('est désactivé (null) sans jeton', () => {
    envMock.env.BETTER_STACK_SOURCE_TOKEN = undefined;
    expect(createBetterStackTransport()).toBeNull();
    envMock.env.BETTER_STACK_SOURCE_TOKEN = '';
    expect(createBetterStackTransport()).toBeNull();
  });

  it('envoie les lignes par lot après 2 secondes, avec le jeton', async () => {
    const t = createBetterStackTransport()!;
    await write(t, '{"msg":"a"}\n');
    await write(t, '{"msg":"b"}\n');
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://in.logs.betterstack.com');
    expect((init as { headers: Record<string, string> }).headers.Authorization).toBe('Bearer token-test');
    expect((init as { body: string }).body).toBe('{"msg":"a"}\n{"msg":"b"}\n');
  });

  it('ignore les lignes vides', async () => {
    const t = createBetterStackTransport()!;
    await write(t, '   \n');
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envoie immédiatement quand 200 lignes sont en attente', async () => {
    const t = createBetterStackTransport()!;
    for (let i = 0; i < 200; i++) await write(t, `{"n":${i}}\n`);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0]![1] as { body: string }).body.split('\n').filter(Boolean)).toHaveLength(200);
  });

  it('ne lève jamais d’erreur quand l’envoi échoue et reprend au flush suivant', async () => {
    fetchMock.mockRejectedValueOnce(new Error('réseau')).mockResolvedValue({ ok: true });
    const t = createBetterStackTransport()!;
    await write(t, '{"n":1}\n');
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await write(t, '{"n":2}\n');
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1]![1] as { body: string }).body).toBe('{"n":2}\n');
  });

  it('abandonne les lignes les plus anciennes en cas de saturation pendant un envoi lent', async () => {
    let release!: () => void;
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { release = () => resolve({ ok: true }); }));
    const t = createBetterStackTransport()!;
    for (let i = 0; i < 200; i++) await write(t, `{"n":${i}}\n`); // 1er envoi (bloqué)
    for (let i = 200; i < 700; i++) await write(t, `{"n":${i}}\n`); // saturation : 400 lignes max conservées
    release();
    for (let i = 0; i < 6; i++) await vi.advanceTimersByTimeAsync(2000);
    const sent = fetchMock.mock.calls.map((c) => (c[1] as { body: string }).body).join('').split('\n').filter(Boolean);
    expect(sent.length).toBeLessThan(700); // des lignes ont bien été abandonnées
    expect(sent).not.toContain('{"n":210}');
    expect(sent).toContain('{"n":699}');
  });
});
