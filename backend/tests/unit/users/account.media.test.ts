import { describe, expect, it, vi } from 'vitest';
import {
  buildMediaBases,
  collectOwnedObjectKeys,
  isOwnedObjectKey,
  objectKeyFromUrl,
  ownedPrefixes,
  runMediaCleanup,
  thumbKeyFor,
  type ObjectStorage,
} from '../../../src/modules/users/account.media';

const U = '0190aaaa-bbbb-7ccc-8ddd-eeeeffff0001';
const OTHER = '0190aaaa-bbbb-7ccc-8ddd-eeeeffff0002';
const BASES = buildMediaBases({ endpoint: 'localhost', port: 9000, useSSL: false, bucket: 'mcm-media' });
const url = (key: string) => `http://localhost:9000/mcm-media/${key}`;

describe('buildMediaBases', () => {
  it('construit la base directe du bucket', () => {
    expect(BASES).toEqual(['http://localhost:9000/mcm-media']);
  });
  it('ajoute une URL publique valide, ignore une URL invalide ou non http', () => {
    const b = buildMediaBases({ endpoint: 'minio', port: 443, useSSL: true, bucket: 'b', publicBaseUrl: 'https://cdn.exemple.com/media/' });
    expect(b).toEqual(['https://minio/b', 'https://cdn.exemple.com/media']);
    expect(buildMediaBases({ endpoint: 'x', port: 1, useSSL: false, bucket: 'b', publicBaseUrl: 'ftp://cdn' })).toEqual(['http://x:1/b']);
    expect(buildMediaBases({ endpoint: 'x', port: 1, useSSL: false, bucket: 'b', publicBaseUrl: 'pas une url' })).toEqual(['http://x:1/b']);
  });
});

describe('isOwnedObjectKey', () => {
  it('accepte les clés générées par l’upload et les miniatures', () => {
    expect(isOwnedObjectKey(`avatar/${U}/1700000000000-ab12cd.jpg`, U)).toBe(true);
    expect(isOwnedObjectKey(`thumbs/post/${U}/thumb.webp`, U)).toBe(true);
  });
  it('refuse un autre propriétaire, une autre finalité, une profondeur inattendue', () => {
    expect(isOwnedObjectKey(`avatar/${OTHER}/a.jpg`, U)).toBe(false);
    expect(isOwnedObjectKey(`secret/${U}/a.jpg`, U)).toBe(false);
    expect(isOwnedObjectKey(`avatar/${U}/sub/a.jpg`, U)).toBe(false);
    expect(isOwnedObjectKey(`avatar/${U}`, U)).toBe(false);
    expect(isOwnedObjectKey(`thumbs/thumbs/avatar/${U}/a.jpg`, U)).toBe(false);
  });
  it('refuse les chemins piégés', () => {
    for (const k of [
      `avatar/${U}/../${OTHER}/a.jpg`,
      `avatar/${U}/..`,
      `../avatar/${U}/a.jpg`,
      `avatar/./${U}/a.jpg`,
      `avatar//${U}/a.jpg`,
      `avatar/${U}/a\\b.jpg`,
      `avatar/${U}/a\u0000.jpg`,
      `avatar/${U}/.hidden`,
      `avatar/${U}/%2e%2e`,
      `/avatar/${U}/a.jpg`,
      '',
    ]) expect(isOwnedObjectKey(k, U), JSON.stringify(k)).toBe(false);
  });
  it('refuse un identifiant utilisateur douteux (jamais de préfixe large)', () => {
    for (const bad of ['', '..', 'a/b', '*', 'court']) {
      expect(isOwnedObjectKey(`avatar/${bad}/a.jpg`, bad)).toBe(false);
    }
  });
});

describe('objectKeyFromUrl', () => {
  it('extrait la clé d’une URL du bucket', () => {
    expect(objectKeyFromUrl(url(`post/${U}/a-1.png`), U, BASES)).toBe(`post/${U}/a-1.png`);
  });
  it('ignore requête et fragment', () => {
    expect(objectKeyFromUrl(`${url(`post/${U}/a.png`)}?X-Amz-Signature=abc#x`, U, BASES)).toBe(`post/${U}/a.png`);
  });
  it('accepte une clé nue', () => {
    expect(objectKeyFromUrl(`story/${U}/v.mp4`, U, BASES)).toBe(`story/${U}/v.mp4`);
  });
  it('ignore une URL externe, même avec un chemin identique', () => {
    expect(objectKeyFromUrl(`https://evil.example/mcm-media/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`https://api.dicebear.com/9.x/avataaars/svg?seed=x`, U, BASES)).toBeNull();
  });
  it('ignore un autre bucket, un autre port, un autre schéma', () => {
    expect(objectKeyFromUrl(`http://localhost:9000/autre/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`http://localhost:9001/mcm-media/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`ftp://localhost:9000/mcm-media/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`blob:http://localhost:9000/mcm-media/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
  });
  it('ignore les hôtes usurpés (userinfo, sous-domaine collé)', () => {
    expect(objectKeyFromUrl(`http://localhost:9000@evil.example/mcm-media/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`http://user:pw@localhost:9000/mcm-media/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`http://localhost:9000.evil.example/mcm-media/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
  });
  it('refuse les chemins piégés, y compris encodés', () => {
    expect(objectKeyFromUrl(url(`avatar/${U}/%2e%2e/${OTHER}/a.jpg`), U, BASES)).toBeNull();
    expect(objectKeyFromUrl(url(`avatar/${OTHER}/a.jpg`), U, BASES)).toBeNull();
    expect(objectKeyFromUrl(url(`avatar/${U}/..%2f${OTHER}%2fa.jpg`), U, BASES)).toBeNull();
    expect(objectKeyFromUrl(url(`avatar/${U}/%252e%252e`), U, BASES)).toBeNull();
    expect(objectKeyFromUrl(url(`avatar/${U}/%ZZ`), U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`../avatar/${U}/a.jpg`, U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`/avatar/${U}/a.jpg`, U, BASES)).toBeNull();
    expect(objectKeyFromUrl(`avatar/${U}/a.jpg?x=1`, U, BASES)).toBeNull();
  });
  it('ignore le fichier d’un tiers collé dans un contenu', () => {
    expect(objectKeyFromUrl(url(`avatar/${OTHER}/a.jpg`), U, BASES)).toBeNull();
  });
  it('ignore les valeurs non texte, vides ou démesurées', () => {
    for (const v of [null, undefined, 12, {}, '', '   ', `http://localhost:9000/mcm-media/${'a'.repeat(3000)}`]) {
      expect(objectKeyFromUrl(v, U, BASES)).toBeNull();
    }
  });
  it('gère une base CDN avec préfixe', () => {
    const bases = buildMediaBases({ endpoint: 'minio', port: 9000, useSSL: false, bucket: 'b', publicBaseUrl: 'https://cdn.exemple.com/m' });
    expect(objectKeyFromUrl(`https://cdn.exemple.com/m/avatar/${U}/a.jpg`, U, bases)).toBe(`avatar/${U}/a.jpg`);
    expect(objectKeyFromUrl(`https://cdn.exemple.com/autre/avatar/${U}/a.jpg`, U, bases)).toBeNull();
  });
});

describe('collectOwnedObjectKeys', () => {
  it('dédoublonne, aplatit les tableaux JSON, ajoute les miniatures et trie', () => {
    const keys = collectOwnedObjectKeys(
      [
        url(`avatar/${U}/a.jpg`),
        url(`avatar/${U}/a.jpg`), // doublon
        `avatar/${U}/a.jpg`, // même objet en clé nue
        [url(`post/${U}/p1.png`), url(`post/${U}/p2.png`), 'https://externe.example/x.png'],
        null,
        undefined,
        'texte libre',
        url(`story/${OTHER}/s.mp4`), // tiers
      ],
      U,
      BASES,
    );
    expect(keys).toEqual([
      `avatar/${U}/a.jpg`,
      `post/${U}/p1.png`,
      `post/${U}/p2.png`,
      thumbKeyFor('avatar', U),
      thumbKeyFor('post', U),
    ].sort());
  });
  it('renvoie une liste vide quand rien n’appartient à l’application', () => {
    expect(collectOwnedObjectKeys(['https://externe.example/a.png', null, []], U, BASES)).toEqual([]);
  });
});

describe('ownedPrefixes', () => {
  it('couvre chaque finalité et les miniatures, toujours terminés par /', () => {
    const p = ownedPrefixes(U);
    expect(p).toHaveLength(10);
    expect(p.every((x) => x.endsWith(`/${U}/`))).toBe(true);
  });
  it('ne renvoie rien pour un identifiant invalide', () => {
    expect(ownedPrefixes('')).toEqual([]);
    expect(ownedPrefixes('../x')).toEqual([]);
  });
});

function fakeStorage(existing: string[]): ObjectStorage & { removed: string[][] } {
  const removed: string[][] = [];
  return {
    removed,
    list: async (prefix) => existing.filter((k) => k.startsWith(prefix)),
    remove: async (keys) => {
      removed.push(keys);
    },
  };
}

describe('runMediaCleanup', () => {
  it('supprime clés du job et fichiers orphelins sous les préfixes, sans doublon', async () => {
    const storage = fakeStorage([`avatar/${U}/old.jpg`, `avatar/${U}/new.jpg`, `avatar/${OTHER}/autre.jpg`]);
    const res = await runMediaCleanup({ userId: U, keys: [`avatar/${U}/new.jpg`, `post/${U}/p.png`] }, storage);
    expect(res).toEqual({ removed: 3, skipped: 0 });
    expect(storage.removed.flat().sort()).toEqual([`avatar/${U}/new.jpg`, `avatar/${U}/old.jpg`, `post/${U}/p.png`]);
  });
  it('écarte les clés piégées ou d’un tiers contenues dans le job', async () => {
    const storage = fakeStorage([]);
    const res = await runMediaCleanup(
      { userId: U, keys: [`avatar/${OTHER}/a.jpg`, `avatar/${U}/../${OTHER}/a.jpg`, 'x', `avatar/${U}/ok.jpg`] },
      storage,
    );
    expect(res).toEqual({ removed: 1, skipped: 3 });
    expect(storage.removed).toEqual([[`avatar/${U}/ok.jpg`]]);
  });
  it('refuse un job sans identifiant valide (ne balaie jamais tout le bucket)', async () => {
    const storage = fakeStorage([`avatar/${U}/a.jpg`]);
    const list = vi.spyOn(storage, 'list');
    await expect(runMediaCleanup({ userId: '', keys: [] }, storage)).rejects.toThrow();
    expect(list).not.toHaveBeenCalled();
    expect(storage.removed).toEqual([]);
  });
  it('découpe en lots et propage l’erreur de stockage (pour réessai)', async () => {
    const many = Array.from({ length: 1200 }, (_, i) => `post/${U}/f${i}.png`);
    const storage = fakeStorage([]);
    await runMediaCleanup({ userId: U, keys: many }, storage);
    expect(storage.removed.map((b) => b.length)).toEqual([500, 500, 200]);

    const failing: ObjectStorage = { list: async () => [], remove: async () => { throw new Error('minio indisponible'); } };
    await expect(runMediaCleanup({ userId: U, keys: [`post/${U}/a.png`] }, failing)).rejects.toThrow('minio indisponible');
  });
  it('ne supprime rien si le stockage ne contient rien (idempotent)', async () => {
    const storage = fakeStorage([]);
    expect(await runMediaCleanup({ userId: U, keys: [] }, storage)).toEqual({ removed: 0, skipped: 0 });
    expect(storage.removed).toEqual([]);
  });
});
