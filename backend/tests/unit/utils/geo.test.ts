import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const redis = { get: vi.fn(), set: vi.fn() };
  const limit = vi.fn();
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const updWhere = vi.fn();
  const updSet = vi.fn(() => ({ where: updWhere }));
  const update = vi.fn(() => ({ set: updSet }));
  return { redis, limit, select, update, updSet, updWhere };
});
vi.mock('../../../src/infrastructure/redis', () => ({ redis: h.redis }));
vi.mock('../../../src/infrastructure/database', () => ({
  db: { select: h.select, update: h.update },
  schema: { users: { id: 'users.id', location: 'users.location' } },
}));

import { detectLocationForUser, lookupGeoByIp } from '../../../src/shared/utils/geo';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  h.redis.get.mockResolvedValue(null);
  h.redis.set.mockResolvedValue('OK');
  h.updWhere.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllGlobals());

const apiOk = (body: unknown) => ({ ok: true, json: async () => body });

describe('lookupGeoByIp', () => {
  it.each(['', 'unknown', '127.0.0.1', '10.1.2.3', '192.168.0.4', '172.16.5.5', '172.31.0.1', '::1', 'localhost'])(
    'ne résout pas l’adresse privée ou inconnue « %s »',
    async (ip) => {
      await expect(lookupGeoByIp(ip)).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('une IP 172.32.x.x (publique) est bien résolue', async () => {
    fetchMock.mockResolvedValue(apiOk({ status: 'success', country: 'France', city: 'Lyon' }));
    await expect(lookupGeoByIp('172.32.0.1')).resolves.toEqual({ country: 'France', city: 'Lyon' });
  });

  it('interroge ip-api, renvoie pays/ville et met le résultat en cache 24h', async () => {
    fetchMock.mockResolvedValue(apiOk({ status: 'success', country: 'France', city: 'Paris' }));
    await expect(lookupGeoByIp('8.8.8.8')).resolves.toEqual({ country: 'France', city: 'Paris' });
    expect(String(fetchMock.mock.calls[0]![0])).toContain('ip-api.com/json/8.8.8.8');
    expect(h.redis.set).toHaveBeenCalledWith('geo:ip:8.8.8.8', JSON.stringify({ country: 'France', city: 'Paris' }), 'EX', 86400);
  });

  it('sert le cache Redis sans appeler le réseau', async () => {
    h.redis.get.mockResolvedValue(JSON.stringify({ country: 'Italie', city: 'Rome' }));
    await expect(lookupGeoByIp('8.8.4.4')).resolves.toEqual({ country: 'Italie', city: 'Rome' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renvoie null si le service répond en erreur HTTP', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(lookupGeoByIp('8.8.8.8')).resolves.toBeNull();
  });

  it('renvoie null si le statut n’est pas « success » et ne met rien en cache', async () => {
    fetchMock.mockResolvedValue(apiOk({ status: 'fail' }));
    await expect(lookupGeoByIp('8.8.8.8')).resolves.toBeNull();
    expect(h.redis.set).not.toHaveBeenCalled();
  });

  it('avale les erreurs réseau (best-effort)', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));
    await expect(lookupGeoByIp('8.8.8.8')).resolves.toBeNull();
  });
});

describe('detectLocationForUser', () => {
  it('ne fait rien sans IP', async () => {
    await detectLocationForUser('u1');
    expect(h.select).not.toHaveBeenCalled();
  });

  it('ne touche pas une localisation déjà définie', async () => {
    h.limit.mockResolvedValue([{ id: 'u1', location: 'Paris, France' }]);
    await detectLocationForUser('u1', '8.8.8.8');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });

  it('ne fait rien pour un utilisateur inconnu', async () => {
    h.limit.mockResolvedValue([]);
    await detectLocationForUser('ghost', '8.8.8.8');
    expect(h.update).not.toHaveBeenCalled();
  });

  it('enregistre « Ville, Pays » quand la localisation est vide', async () => {
    h.limit.mockResolvedValue([{ id: 'u1', location: null }]);
    fetchMock.mockResolvedValue(apiOk({ status: 'success', country: 'France', city: 'Nantes' }));
    await detectLocationForUser('u1', '8.8.8.8');
    expect(h.updSet).toHaveBeenCalledWith(expect.objectContaining({ location: 'Nantes, France' }));
  });

  it('enregistre uniquement le pays quand la ville est inconnue', async () => {
    h.limit.mockResolvedValue([{ id: 'u1', location: null }]);
    fetchMock.mockResolvedValue(apiOk({ status: 'success', country: 'Belgique' }));
    await detectLocationForUser('u1', '8.8.8.8');
    expect(h.updSet).toHaveBeenCalledWith(expect.objectContaining({ location: 'Belgique' }));
  });

  it('ne lève jamais d’erreur si la base échoue', async () => {
    h.limit.mockRejectedValue(new Error('db down'));
    await expect(detectLocationForUser('u1', '8.8.8.8')).resolves.toBeUndefined();
  });
});
