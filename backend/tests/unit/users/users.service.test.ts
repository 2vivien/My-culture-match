import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chain } from '../helpers/drizzle-fake';

const h = vi.hoisted(() => ({
  select: vi.fn(), update: vi.fn(), insert: vi.fn(), delete: vi.fn(),
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn(), zrem: vi.fn(), multi: vi.fn() },
  addFollower: vi.fn(), removeFollower: vi.fn(),
}));
vi.mock('../../../src/infrastructure/database', () => {
  const schema = new Proxy({}, { get: (_t, table: string) => new Proxy({}, { get: (_c, col: string) => `${table}.${col}` }) });
  return { db: { select: h.select, update: h.update, insert: h.insert, delete: h.delete }, schema };
});
vi.mock('../../../src/infrastructure/redis', () => ({ redis: h.redis }));
vi.mock('../../../src/modules/feed/fanout', () => ({
  addFollower: h.addFollower, removeFollower: h.removeFollower, followingKey: (id: string) => `feed:following:${id}`,
}));

import {
  followUser, getCurrentUser, getFollowingIds, getPublicUser, haversineKm, unfollowUser, updateLocation, updateProfile,
} from '../../../src/modules/users/users.service';

const userRow = (extra: Record<string, unknown> = {}) => ({
  id: 'u1', name: 'Alice', username: 'alice', avatar: null, banner: null, avatarSeed: 's', locale: 'fr', level: 2, glow: 'violet', xp: 10,
  location: 'Paris', country: 'France', region: null, gender: 'female', seeking: null, age: 30, roots: null, languages: ['fr'], intention: null,
  occupation: null, values: null, preference: null, diaspora: null, familyQuiz: null, situation: null, criteria: null, bio: 'Salut',
  traditionsCount: 1, culturesCount: 2, tribesCount: 3, interestedCount: 4, companionsCount: 5, profileCompleted: true,
  createdAt: new Date('2026-01-01T00:00:00Z'), ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  h.redis.get.mockResolvedValue(null);
  h.redis.set.mockResolvedValue('OK');
  h.addFollower.mockResolvedValue(undefined);
  h.removeFollower.mockResolvedValue(undefined);
  // enableLocationSharing crée la ligne de réglages si elle manque.
  h.insert.mockReturnValue(chain(undefined));
});

describe('haversineKm', () => {
  it('renvoie 0 pour deux points identiques', () => {
    expect(haversineKm(48.85, 2.35, 48.85, 2.35)).toBe(0);
  });
  it('Paris – Lyon ≈ 392 km', () => {
    expect(haversineKm(48.8566, 2.3522, 45.764, 4.8357)).toBeGreaterThan(385);
    expect(haversineKm(48.8566, 2.3522, 45.764, 4.8357)).toBeLessThan(400);
  });
  it('est symétrique', () => {
    expect(haversineKm(10, 20, 30, 40)).toBeCloseTo(haversineKm(30, 40, 10, 20), 8);
  });
});

describe('getCurrentUser', () => {
  it('renvoie le profil sérialisé avec ses tribus', async () => {
    h.select.mockReturnValueOnce(chain([userRow()])).mockReturnValueOnce(chain([{ name: 'Cuisine' }, { name: 'Jazz' }]));
    const me = await getCurrentUser('u1');
    expect(me).toMatchObject({ id: 'u1', username: 'alice', tribes: ['Cuisine', 'Jazz'], createdAt: '2026-01-01T00:00:00.000Z', languages: ['fr'] });
    expect(me).not.toHaveProperty('email');
  });

  it('renvoie 404 pour un utilisateur inconnu', async () => {
    h.select.mockReturnValueOnce(chain([]));
    await expect(getCurrentUser('ghost')).rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' });
  });
});

describe('getPublicUser', () => {
  it('construit le profil, ajoute les compteurs d’abonnés et le met en cache 1h', async () => {
    h.select
      .mockReturnValueOnce(chain([userRow()]))
      .mockReturnValueOnce(chain([{ name: 'Jazz' }]))
      .mockReturnValueOnce(chain([{ count: 12 }]))
      .mockReturnValueOnce(chain([]));
    const profile = await getPublicUser('u1');
    expect(profile).toMatchObject({ followersCount: 12, followingCount: 0, tribes: ['Jazz'] });
    expect(h.redis.set).toHaveBeenCalledWith('user:u1', expect.any(String), 'EX', 3600);
    expect(profile).not.toHaveProperty('isFollowing');
  });

  it('sert le profil depuis le cache sans toucher à la base', async () => {
    h.redis.get.mockResolvedValue(JSON.stringify({ id: 'u1', name: 'Alice' }));
    await expect(getPublicUser('u1')).resolves.toEqual({ id: 'u1', name: 'Alice' });
    expect(h.select).not.toHaveBeenCalled();
  });

  it('indique si le visiteur suit déjà la personne', async () => {
    h.redis.get.mockResolvedValue(JSON.stringify({ id: 'u1' }));
    h.select.mockReturnValueOnce(chain([{ followerId: 'v1' }])).mockReturnValueOnce(chain([]));
    await expect(getPublicUser('u1', 'v1')).resolves.toEqual({ id: 'u1', isFollowing: true });
    await expect(getPublicUser('u1', 'v2')).resolves.toEqual({ id: 'u1', isFollowing: false });
  });

  it('ne calcule pas isFollowing pour son propre profil', async () => {
    h.redis.get.mockResolvedValue(JSON.stringify({ id: 'u1' }));
    await expect(getPublicUser('u1', 'u1')).resolves.toEqual({ id: 'u1' });
    expect(h.select).not.toHaveBeenCalled();
  });
});

describe('updateProfile', () => {
  it('met à jour, invalide le cache et renvoie le profil', async () => {
    const upd = chain([userRow({ bio: 'Nouvelle bio' })]);
    h.update.mockReturnValue(upd);
    h.select.mockReturnValueOnce(chain([{ name: 'Jazz' }]));
    const out = await updateProfile('u1', { bio: 'Nouvelle bio' } as never);
    expect(out).toMatchObject({ bio: 'Nouvelle bio', tribes: ['Jazz'] });
    expect(upd.args.set![0]).toMatchObject({ bio: 'Nouvelle bio', updatedAt: expect.any(Date) });
    expect(h.redis.del).toHaveBeenCalledWith('user:u1');
  });

  it('renvoie 404 quand aucune ligne n’est mise à jour', async () => {
    h.update.mockReturnValue(chain([]));
    await expect(updateProfile('ghost', {} as never)).rejects.toMatchObject({ status: 404 });
    expect(h.redis.del).not.toHaveBeenCalled();
  });
});

describe('updateLocation', () => {
  it('exige un consentement explicite pour la première activation', async () => {
    h.select.mockReturnValueOnce(chain([{ on: false }]));
    await expect(updateLocation('u1', { latitude: 1, longitude: 2 })).rejects.toMatchObject({ status: 400, code: 'LOCATION_CONSENT_REQUIRED' });
    expect(h.update).not.toHaveBeenCalled();
  });

  it('enregistre les coordonnées avec consentement', async () => {
    const upd = chain(undefined);
    h.update.mockReturnValue(upd);
    h.select.mockReturnValueOnce(chain([{ on: false }]));
    await expect(updateLocation('u1', { latitude: 48.8, longitude: 2.3, consent: true })).resolves.toEqual({
      success: true, latitude: 48.8, longitude: 2.3, locationSharingEnabled: true,
    });
    expect(upd.args.set![0]).toMatchObject({ latitude: 48.8, longitude: 2.3, locationSharingEnabled: true });
    expect(h.redis.del).toHaveBeenCalledWith('location:settings:u1', 'user:u1');
  });

  it('met à jour la position sans nouveau consentement quand le partage est déjà actif', async () => {
    h.update.mockReturnValue(chain(undefined));
    h.select.mockReturnValueOnce(chain([{ on: true }]));
    await expect(updateLocation('u1', { latitude: 1, longitude: 2 })).resolves.toMatchObject({ locationSharingEnabled: true });
  });

  it('désactiver le partage efface les coordonnées renvoyées, sans demander de consentement', async () => {
    const usersUpd = chain(undefined);
    const storiesUpd = chain(undefined);
    h.update.mockReturnValueOnce(usersUpd).mockReturnValueOnce(storiesUpd);
    await expect(updateLocation('u1', { enabled: false })).resolves.toEqual({ success: true, latitude: null, longitude: null, locationSharingEnabled: false });
    expect(h.select).not.toHaveBeenCalled();
    expect(usersUpd.args.set![0]).toMatchObject({ locationSharingEnabled: false });
    expect(storiesUpd.args.set![0]).toMatchObject({ placeLat: null, placeLon: null, placeLabel: null });
    expect(h.redis.del).toHaveBeenCalledWith('location:settings:u1', 'user:u1');
  });
});

describe('followUser', () => {
  it('refuse de se suivre soi-même', async () => {
    await expect(followUser('u1', 'u1')).rejects.toMatchObject({ code: 'SELF_FOLLOW' });
    expect(h.select).not.toHaveBeenCalled();
  });

  it('renvoie 404 pour une cible inconnue', async () => {
    h.select.mockReturnValueOnce(chain([]));
    await expect(followUser('u1', 'ghost')).rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' });
  });

  it('refuse quand un blocage existe (dans un sens ou l’autre)', async () => {
    h.select.mockReturnValueOnce(chain([{ id: 'u2' }])).mockReturnValueOnce(chain([{ blockerId: 'u2' }]));
    await expect(followUser('u1', 'u2')).rejects.toMatchObject({ status: 403, code: 'BLOCKED' });
    expect(h.insert).not.toHaveBeenCalled();
    expect(h.addFollower).not.toHaveBeenCalled();
  });

  it('suit la cible, met à jour le fanout et recopie ses derniers posts dans le feed', async () => {
    const ins = chain(undefined);
    h.insert.mockReturnValue(ins);
    const pipe = { zadd: vi.fn(), exec: vi.fn().mockResolvedValue([]) };
    h.redis.multi.mockReturnValue(pipe);
    h.select
      .mockReturnValueOnce(chain([{ id: 'u2' }]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([{ id: 'p1', createdAt: new Date(1000) }, { id: 'p2', createdAt: new Date(2000) }]));
    await expect(followUser('u1', 'u2')).resolves.toEqual({ following: true });
    expect(ins.calls).toContain('onConflictDoNothing');
    expect(h.addFollower).toHaveBeenCalledWith('u2', 'u1');
    expect(pipe.zadd).toHaveBeenCalledWith('feed:following:u1', 1000, 'p1');
    expect(pipe.zadd).toHaveBeenCalledWith('feed:following:u1', 2000, 'p2');
    expect(pipe.exec).toHaveBeenCalledTimes(1);
  });

  it('ne touche pas au feed quand la cible n’a encore rien publié', async () => {
    h.insert.mockReturnValue(chain(undefined));
    h.select.mockReturnValueOnce(chain([{ id: 'u2' }])).mockReturnValueOnce(chain([])).mockReturnValueOnce(chain([]));
    await followUser('u1', 'u2');
    expect(h.redis.multi).not.toHaveBeenCalled();
  });
});

describe('unfollowUser', () => {
  it('supprime le lien, met à jour le fanout et retire ses posts du feed', async () => {
    h.delete.mockReturnValue(chain(undefined));
    h.select.mockReturnValueOnce(chain([{ id: 'p1' }, { id: 'p2' }]));
    await expect(unfollowUser('u1', 'u2')).resolves.toEqual({ following: false });
    expect(h.removeFollower).toHaveBeenCalledWith('u2', 'u1');
    expect(h.redis.zrem).toHaveBeenCalledWith('feed:following:u1', 'p1', 'p2');
  });

  it('ne purge rien quand l’auteur n’a aucun post', async () => {
    h.delete.mockReturnValue(chain(undefined));
    h.select.mockReturnValueOnce(chain([]));
    await unfollowUser('u1', 'u2');
    expect(h.redis.zrem).not.toHaveBeenCalled();
  });
});

describe('getFollowingIds', () => {
  it('renvoie les identifiants suivis', async () => {
    h.select.mockReturnValueOnce(chain([{ followingId: 'a' }, { followingId: 'b' }]));
    await expect(getFollowingIds('u1')).resolves.toEqual(['a', 'b']);
  });
});
