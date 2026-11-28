import { describe, expect, it } from 'vitest';
import {
  evaluateNearbyCandidate,
  NEARBY_RADIUS_KM,
  type NearbyCandidate,
  type NearbyRelations,
} from '../../../src/modules/location/location.nearby.filter';

const VIEWER = 'viewer';
const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

const candidate = (over: Partial<NearbyCandidate> = {}): NearbyCandidate => ({
  id: 'cand',
  latitude: 6.37,
  longitude: 2.39,
  visibility: 'nearby',
  audienceMode: 'default',
  ghost: false,
  expiresAt: null,
  ...over,
});

const relations = (over: { friends?: string[]; fof?: string[]; blocked?: string[]; listedBy?: string[] } = {}): NearbyRelations => ({
  friendIds: new Set(over.friends ?? []),
  friendOfFriendIds: new Set(over.fof ?? []),
  blockedIds: new Set(over.blocked ?? []),
  listedByIds: new Set(over.listedBy ?? []),
});

const run = (c: NearbyCandidate, r: NearbyRelations, distanceKm: number | null = 5) => evaluateNearbyCandidate(VIEWER, c, r, distanceKm, NOW);

type Rel = 'stranger' | 'fof' | 'friend';
const relOf = (rel: Rel) => relations({ friends: rel === 'friend' ? ['cand'] : [], fof: rel === 'fof' ? ['cand'] : [] });

describe('évaluation d’un candidat « People Nearby »', () => {
  it('rayon constant à 50 km', () => {
    expect(NEARBY_RADIUS_KM).toBe(50);
  });

  describe('matrice visibilité × relation (audience par défaut)', () => {
    const expected: Record<string, Record<Rel, boolean>> = {
      nobody: { stranger: false, fof: false, friend: false },
      friends: { stranger: false, fof: false, friend: true },
      friends_of_friends: { stranger: false, fof: true, friend: true },
      nearby: { stranger: true, fof: true, friend: true },
      everyone: { stranger: true, fof: true, friend: true },
    };
    for (const [visibility, byRel] of Object.entries(expected)) {
      for (const [rel, visible] of Object.entries(byRel) as Array<[Rel, boolean]>) {
        it(`${visibility} × ${rel} → ${visible ? 'visible' : 'refusé'}`, () => {
          const d = run(candidate({ visibility }), relOf(rel));
          expect(d.visible).toBe(visible);
          if (!d.visible) expect(d.reason).toBe('not_allowed');
        });
      }
    }
  });

  describe('personne et valeurs inconnues', () => {
    it('visibilité « nobody » refuse même un ami listé en mode selected', () => {
      const d = run(candidate({ visibility: 'nobody', audienceMode: 'selected' }), relations({ friends: ['cand'], listedBy: ['cand'] }));
      expect(d).toEqual({ visible: false, reason: 'not_allowed' });
    });
    it('sans ligne de réglages (LEFT JOIN nul) : visibilité par défaut « nearby »', () => {
      expect(run(candidate({ visibility: null, audienceMode: null, ghost: null }), relations()).visible).toBe(true);
    });
    it('visibilité inconnue : retombe sur « nearby » (comportement historique)', () => {
      expect(run(candidate({ visibility: 'galaxy' }), relations()).visible).toBe(true);
    });
    it('audience inconnue : retombe sur « default »', () => {
      expect(run(candidate({ visibility: 'friends', audienceMode: 'bizarre' }), relOf('friend')).visible).toBe(true);
      expect(run(candidate({ visibility: 'friends', audienceMode: 'bizarre' }), relOf('stranger')).visible).toBe(false);
    });
  });

  describe('refus prioritaires', () => {
    it('refuse soi-même', () => {
      expect(evaluateNearbyCandidate(VIEWER, candidate({ id: VIEWER, visibility: 'everyone' }), relations({ friends: [VIEWER] }), 0, NOW)).toEqual({ visible: false, reason: 'self' });
    });

    for (const visibility of ['friends', 'friends_of_friends', 'nearby', 'everyone']) {
      it(`bloqué : refusé même avec visibilité ${visibility} et ami`, () => {
        const d = run(candidate({ visibility }), relations({ friends: ['cand'], blocked: ['cand'] }));
        expect(d).toEqual({ visible: false, reason: 'blocked' });
      });
    }

    it('bloqué : refusé aussi en mode selected et listé', () => {
      const d = run(candidate({ visibility: 'friends', audienceMode: 'selected' }), relations({ friends: ['cand'], listedBy: ['cand'], blocked: ['cand'] }));
      expect(d).toEqual({ visible: false, reason: 'blocked' });
    });

    it('coordonnées absentes : refusé', () => {
      expect(run(candidate({ latitude: null }), relations(), null)).toEqual({ visible: false, reason: 'no_coordinates' });
      expect(run(candidate({ longitude: null }), relations(), null)).toEqual({ visible: false, reason: 'no_coordinates' });
    });
  });

  describe('mode fantôme et expiration', () => {
    for (const visibility of ['friends', 'friends_of_friends', 'nearby', 'everyone']) {
      it(`mode fantôme masque un ami en visibilité ${visibility}`, () => {
        expect(run(candidate({ visibility, ghost: true }), relOf('friend'))).toEqual({ visible: false, reason: 'hidden' });
      });
    }

    it('expiration passée : masqué', () => {
      expect(run(candidate({ expiresAt: new Date(NOW - 1000) }), relOf('friend'))).toEqual({ visible: false, reason: 'hidden' });
    });
    it('expiration exactement maintenant : masqué (borne incluse)', () => {
      expect(run(candidate({ expiresAt: new Date(NOW) }), relOf('friend'))).toEqual({ visible: false, reason: 'hidden' });
    });
    it('expiration future : visible', () => {
      expect(run(candidate({ expiresAt: new Date(NOW + 1000) }), relOf('stranger')).visible).toBe(true);
    });
    it('sans expiration : visible', () => {
      expect(run(candidate({ expiresAt: null }), relOf('stranger')).visible).toBe(true);
    });
    it('fantôme et expiré cumulés : masqué', () => {
      expect(run(candidate({ ghost: true, expiresAt: new Date(NOW - 1) }), relOf('friend'))).toEqual({ visible: false, reason: 'hidden' });
    });
  });

  describe('rayon de 50 km', () => {
    it('visible à 0, 49.9 et 50 km', () => {
      for (const km of [0, 49.9, 50]) expect(run(candidate(), relations(), km).visible).toBe(true);
    });
    it('refusé au-delà de 50 km', () => {
      for (const km of [50.01, 51, 500]) expect(run(candidate(), relations(), km)).toEqual({ visible: false, reason: 'out_of_range' });
    });
    it('un ami hors rayon reste refusé', () => {
      expect(run(candidate({ visibility: 'friends' }), relOf('friend'), 80)).toEqual({ visible: false, reason: 'out_of_range' });
    });
    it('distance inconnue : refusé par prudence', () => {
      expect(run(candidate(), relations(), null).visible).toBe(false);
    });
  });

  describe('audience « selected » (uniquement les listés, qui doivent rester compagnons)', () => {
    const sel = (visibility: string) => candidate({ visibility, audienceMode: 'selected' });
    for (const visibility of ['friends', 'friends_of_friends', 'nearby', 'everyone']) {
      it(`${visibility} : ami listé visible`, () => {
        expect(run(sel(visibility), relations({ friends: ['cand'], listedBy: ['cand'] })).visible).toBe(true);
      });
      it(`${visibility} : ami non listé refusé`, () => {
        expect(run(sel(visibility), relations({ friends: ['cand'] }))).toEqual({ visible: false, reason: 'not_allowed' });
      });
      it(`${visibility} : ancien ami encore listé refusé (liste périmée)`, () => {
        expect(run(sel(visibility), relations({ listedBy: ['cand'] }))).toEqual({ visible: false, reason: 'not_allowed' });
      });
      it(`${visibility} : ami d’ami listé refusé`, () => {
        expect(run(sel(visibility), relations({ fof: ['cand'], listedBy: ['cand'] }))).toEqual({ visible: false, reason: 'not_allowed' });
      });
      it(`${visibility} : inconnu refusé, listé ou non`, () => {
        expect(run(sel(visibility), relations()).visible).toBe(false);
        expect(run(sel(visibility), relations({ listedBy: ['cand'] })).visible).toBe(false);
      });
    }
  });

  describe('audience « except » (visibilité habituelle sauf les listés)', () => {
    const exc = (visibility: string) => candidate({ visibility, audienceMode: 'except' });
    it('friends : ami non listé visible, ami listé refusé', () => {
      expect(run(exc('friends'), relOf('friend')).visible).toBe(true);
      expect(run(exc('friends'), relations({ friends: ['cand'], listedBy: ['cand'] }))).toEqual({ visible: false, reason: 'not_allowed' });
    });
    it('friends : non-ami toujours refusé, listé ou non', () => {
      expect(run(exc('friends'), relOf('stranger')).visible).toBe(false);
      expect(run(exc('friends'), relations({ listedBy: ['cand'] })).visible).toBe(false);
    });
    it('friends_of_friends : ami d’ami visible sauf s’il est listé', () => {
      expect(run(exc('friends_of_friends'), relOf('fof')).visible).toBe(true);
      expect(run(exc('friends_of_friends'), relations({ fof: ['cand'], listedBy: ['cand'] })).visible).toBe(false);
    });
    for (const visibility of ['nearby', 'everyone']) {
      it(`${visibility} : inconnu non listé visible, inconnu listé refusé`, () => {
        expect(run(exc(visibility), relOf('stranger')).visible).toBe(true);
        expect(run(exc(visibility), relations({ listedBy: ['cand'] }))).toEqual({ visible: false, reason: 'not_allowed' });
      });
    }
    it('nobody : refusé quoi qu’il arrive', () => {
      expect(run(exc('nobody'), relOf('friend')).visible).toBe(false);
    });
  });

  describe('audience « default » : une liste existante est ignorée', () => {
    it('un listé en mode default n’est pas pénalisé ni avantagé', () => {
      expect(run(candidate({ visibility: 'friends' }), relations({ listedBy: ['cand'] })).visible).toBe(false);
      expect(run(candidate({ visibility: 'friends' }), relations({ friends: ['cand'], listedBy: ['cand'] })).visible).toBe(true);
    });
  });

  describe('ancien ami (relation supprimée)', () => {
    it('friends : n’apparaît plus une fois retiré des compagnons', () => {
      expect(run(candidate({ visibility: 'friends' }), relations()).visible).toBe(false);
    });
  });

  describe('sécurité : exhaustivité du produit cartésien', () => {
    const visibilities = ['nobody', 'friends', 'friends_of_friends', 'nearby', 'everyone'];
    const modes = ['default', 'selected', 'except'];
    const rels: Rel[] = ['stranger', 'fof', 'friend'];
    const bools = [false, true];
    const policy = (v: string, m: string, rel: Rel, listed: boolean): boolean => {
      if (v === 'nobody') return false;
      if (m === 'selected') return listed && rel === 'friend';
      const base = v === 'friends' ? rel === 'friend' : v === 'friends_of_friends' ? rel !== 'stranger' : true;
      return m === 'except' ? base && !listed : base;
    };

    it('aucun cas bloqué / fantôme / expiré / hors rayon / sans partage n’est jamais visible', () => {
      for (const v of visibilities) for (const m of modes) for (const rel of rels) for (const listed of bools) {
        const r = relations({
          friends: rel === 'friend' ? ['cand'] : [],
          fof: rel === 'fof' ? ['cand'] : [],
          listedBy: listed ? ['cand'] : [],
        });
        const blockedRel = { ...r, blockedIds: new Set(['cand']) };
        expect(run(candidate({ visibility: v, audienceMode: m }), blockedRel).visible).toBe(false);
        expect(run(candidate({ visibility: v, audienceMode: m, ghost: true }), r).visible).toBe(false);
        expect(run(candidate({ visibility: v, audienceMode: m, expiresAt: new Date(NOW - 1) }), r).visible).toBe(false);
        expect(run(candidate({ visibility: v, audienceMode: m }), r, 50.5).visible).toBe(false);
        expect(run(candidate({ visibility: v, audienceMode: m, latitude: null }), r, null).visible).toBe(false);
      }
    });

    it('le cas nominal suit exactement la matrice de la politique', () => {
      for (const v of visibilities) for (const m of modes) for (const rel of rels) for (const listed of bools) {
        const r = relations({
          friends: rel === 'friend' ? ['cand'] : [],
          fof: rel === 'fof' ? ['cand'] : [],
          listedBy: listed ? ['cand'] : [],
        });
        const d = run(candidate({ visibility: v, audienceMode: m }), r);
        expect(d.visible, `${v}/${m}/${rel}/listed=${listed}`).toBe(policy(v, m, rel, listed));
      }
    });
  });
});
