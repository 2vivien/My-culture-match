import { describe, it, expect } from 'vitest';
import {
  engagementPred,
  socialAffinity,
  interestMatch,
  cultureResonance,
  freshness,
  diversityBoost,
  qualityEthics,
  addictionPenalty,
  safetyFilter,
  scoreFeed,
  valueAlignment,
  psychologyCompat,
  emotionalMatch,
  culturalRoots,
  proximity,
  interestOverlap,
  compatLove,
  synergy,
} from '../../../src/modules/culture-engine/scoring';
import type { FeedContext, PostFeatures, UserFeatures } from '../../../src/modules/culture-engine/scoring';

const basePost: PostFeatures = {
  id: 'p1',
  authorId: 'a1',
  type: 'Text',
  title: null,
  body: 'Un contenu authentique assez long pour être de bonne qualité éditoriale et culturelle.',
  tags: ['musique'],
  status: 'published',
  likes: 10,
  comments: 2,
  views: 100,
  createdAt: new Date(),
  tribeId: null,
};

const baseUser: UserFeatures = {
  id: 'u1',
  values: ['liberte'],
  languages: ['fr'],
  ethnicity: 'Wolof',
  country: 'SN',
  region: 'Dakar',
};

describe('scoring — P-ENG engagement', () => {
  it('vaut 0 sans engagement', () => {
    expect(engagementPred({ ...basePost, likes: 0, comments: 0, views: 0 })).toBe(0);
  });

  it('tend vers 1 pour un fort engagement (borné)', () => {
    const p = engagementPred({ ...basePost, likes: 500, comments: 50, views: 5000 });
    expect(p).toBeGreaterThan(0.9);
    expect(p).toBeLessThanOrEqual(1);
  });
});

describe('scoring — P-SOC affinité sociale', () => {
  it('vaut 0 sans tribu commune ni follow', () => {
    expect(socialAffinity({ sharedTribes: 0, followingAuthor: false })).toBe(0);
  });

  it('atteint 1 avec 2 tribus communes et un follow', () => {
    expect(socialAffinity({ sharedTribes: 2, followingAuthor: true })).toBe(1);
  });

  it('est proportionnel aux tribus communes', () => {
    expect(socialAffinity({ sharedTribes: 1, followingAuthor: false })).toBeCloseTo(0.2, 5);
  });
});

describe('scoring — P-INT intérêts', () => {
  it('vaut 1 si tous les tags matchent (dans la limite de 3)', () => {
    expect(interestMatch(['musique'], ['musique'])).toBe(1);
  });

  it('est insensible à la casse', () => {
    expect(interestMatch(['Musique'], ['musique'])).toBe(1);
  });

  it('retourne 0.2 quand un côté est vide (fallback)', () => {
    expect(interestMatch([], ['musique'])).toBe(0.2);
    expect(interestMatch(['musique'], [])).toBe(0.2);
  });
});

describe('scoring — P-CUL résonance culturelle', () => {
  it('vaut 1 pour des vecteurs identiques', () => {
    expect(cultureResonance({ '1': 1, '2': 0.5 }, { '1': 1, '2': 0.5 })).toBeCloseTo(1, 5);
  });

  it('vaut 0 pour des vecteurs opposés', () => {
    expect(cultureResonance({ '1': 1 }, { '1': -1 })).toBeCloseTo(0, 5);
  });

  it('retourne 0.4 en fallback (vecteurs absents)', () => {
    expect(cultureResonance(undefined, { '1': 1 })).toBe(0.4);
    expect(cultureResonance({ '1': 1 }, undefined)).toBe(0.4);
    expect(cultureResonance({}, { '1': 1 })).toBe(0.4);
  });
});

describe('scoring — P-FR fraîcheur', () => {
  it('vaut ~1 pour un post immédiat', () => {
    expect(freshness(new Date())).toBeCloseTo(1, 3);
  });

  it('décroît avec l’âge (courbe)', () => {
    const oneHour = new Date(Date.now() - 3_600_000);
    expect(freshness(oneHour)).toBeCloseTo(1 / 1.6, 5);
    expect(freshness(new Date(Date.now() - 100 * 3_600_000))).toBeLessThan(0.05);
  });

  it('gère un post dans le futur (borné à 1)', () => {
    expect(freshness(new Date(Date.now() + 3_600_000))).toBe(1);
  });
});

describe('scoring — P-DIV bonus diversité', () => {
  it('pénalise le contenu 100% dans la culture habituelle', () => {
    expect(diversityBoost(['musique'], ['musique'])).toBe(0.3);
  });

  it('récompense la nouveauté culturelle', () => {
    expect(diversityBoost(['musique', 'danse'], ['musique'])).toBeCloseTo(0.65, 5);
  });

  it('retourne 0.5 sans tags', () => {
    expect(diversityBoost([], ['musique'])).toBe(0.5);
  });
});

describe('scoring — P-QUAL qualité & éthique', () => {
  it('retourne 0.4 sans texte', () => {
    expect(qualityEthics({ ...basePost, title: null, body: null })).toBe(0.4);
  });

  it('plafonne à 1 pour un long texte', () => {
    const long = 'mot '.repeat(600);
    expect(qualityEthics({ ...basePost, title: null, body: long })).toBe(1);
  });
});

describe('scoring — P-ADD pénalité addiction', () => {
  it('détecte le clickbait', () => {
    expect(addictionPenalty({ ...basePost, title: 'Tu ne devineras jamais', body: null })).toBe(0.3);
  });

  it('détecte l’outrance', () => {
    expect(addictionPenalty({ ...basePost, title: null, body: "j'explose !" })).toBe(0.3);
  });

  it('cumule les deux', () => {
    expect(addictionPenalty({ ...basePost, title: 'Clique ici', body: 'je me suis détruit' })).toBe(0.6);
  });

  it('vaut 0 pour un contenu sain', () => {
    expect(addictionPenalty(basePost)).toBe(0);
  });
});

describe('scoring — P-SAFE filtre de sécurité', () => {
  it('bloque un post flaggé', () => {
    const r = safetyFilter({ ...basePost, status: 'flagged' });
    expect(r.safe).toBe(false);
    expect(r.score).toBe(0);
  });

  it('laisse passer un post publié', () => {
    const r = safetyFilter(basePost);
    expect(r.safe).toBe(true);
    expect(r.score).toBe(1);
  });
});

describe('scoring — scoreFeed fusion pondérée', () => {
  it('retourne 0 pour un post flaggé (tolérance zéro)', () => {
    const ctx: FeedContext = { seenPostIds: [], userCulture: [] };
    expect(scoreFeed({ ...basePost, status: 'flagged' }, baseUser, ctx)).toBe(0);
  });

  it('reste dans [0, 1]', () => {
    const ctx: FeedContext = { seenPostIds: [], userCulture: ['musique'] };
    const s = scoreFeed(basePost, baseUser, ctx);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it('classe un post fortement pertinent au-dessus d’un post faible', () => {
    const strong: PostFeatures = {
      ...basePost,
      likes: 300,
      comments: 40,
      views: 3000,
      tags: ['musique', 'danse'],
      body: 'un très long contenu de qualité éditoriale exceptionnelle et culturellement riche pour la communauté',
    };
    const weak: PostFeatures = {
      ...basePost,
      likes: 0,
      comments: 0,
      views: 0,
      title: 'Clique ici',
      body: 'x',
      tags: [],
      createdAt: new Date(Date.now() - 48 * 3_600_000),
    };
    const ctx: FeedContext = {
      seenPostIds: [],
      userCulture: [],
      sharedTribes: 2,
      followingAuthor: true,
    };
    expect(scoreFeed(strong, baseUser, ctx)).toBeGreaterThan(scoreFeed(weak, baseUser, ctx));
  });
});

describe('scoring — LOVE', () => {
  it('valueAlignment : 1 pour des valeurs identiques, borné [0,1]', () => {
    expect(valueAlignment(['a', 'b'], ['a', 'b'])).toBe(1);
    expect(valueAlignment(['a', 'b'], ['a', 'c'])).toBeCloseTo(1 / 3, 5);
    expect(valueAlignment([], ['a'])).toBe(0.4);
  });

  it('psychologyCompat est une fonction croissante de l’alignement', () => {
    const full = psychologyCompat({ ...baseUser, values: ['a', 'b'] }, { ...baseUser, values: ['a', 'b'] });
    const none = psychologyCompat({ ...baseUser, values: ['a'] }, { ...baseUser, values: ['z'] });
    expect(full).toBeGreaterThan(none);
  });

  it('emotionalMatch : bonus par valeur émotionnelle partagée', () => {
    const emo = emotionalMatch({ ...baseUser, values: ['joie', 'serenite'] }, { ...baseUser, values: ['joie'] });
    expect(emo).toBeGreaterThan(0.3);
    expect(emotionalMatch(baseUser, { ...baseUser, values: [] })).toBe(0.3);
  });

  it('culturalRoots : même ethnicité + pays → 1', () => {
    expect(culturalRoots(baseUser, baseUser)).toBe(1);
  });

  it('proximity : pays identique mais région différente → 0.6', () => {
    const other = { ...baseUser, region: 'Thiès' };
    expect(proximity(baseUser, other)).toBe(0.6);
    expect(proximity(baseUser, { ...baseUser, country: 'FR' })).toBe(0);
  });

  it('interestOverlap = valueAlignment des intérêts', () => {
    const a = { ...baseUser, interests: ['x', 'y'] };
    const b = { ...baseUser, interests: ['x', 'z'] };
    // shared=1 sur un ensemble unique de 3 → 1/3
    expect(interestOverlap(a, b)).toBeCloseTo(1 / 3, 5);
  });

  it('compatLove est borné [0, 100] et arrondi', () => {
    const identical = compatLove(baseUser, baseUser);
    const opposite = compatLove(
      { ...baseUser, values: ['a'], ethnicity: 'A', country: 'AA', region: 'A1', languages: ['xx'], interests: ['z'] },
      { ...baseUser, values: ['b'], ethnicity: 'B', country: 'BB', region: 'B1', languages: ['yy'], interests: ['w'] },
    );
    expect(identical).toBeGreaterThanOrEqual(0);
    expect(identical).toBeLessThanOrEqual(100);
    expect(opposite).toBeLessThanOrEqual(100);
    expect(Number.isInteger(identical)).toBe(true);
    expect(identical).toBeGreaterThanOrEqual(opposite);
  });
});

describe('scoring — AMITIÉ synergy', () => {
  it('est borné [0, 100]', () => {
    const s = synergy({ reciprocity: 0.5, density: 0.5, sharedTribes: 1, valuesA: ['a'], valuesB: ['a'], toxicity: 0 });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it('augmente avec la réciprocité et la densité', () => {
    const low = synergy({ reciprocity: 0, density: 0, sharedTribes: 0, valuesA: [], valuesB: [], toxicity: 0 });
    const high = synergy({ reciprocity: 1, density: 1, sharedTribes: 2, valuesA: ['a'], valuesB: ['a'], toxicity: 0 });
    expect(high).toBeGreaterThan(low);
  });
});
