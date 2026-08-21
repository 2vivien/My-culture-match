import { describe, it, expect } from 'vitest';
import { hashEmbedding, tokenize, cosineSimilarity, EMBEDDING_DIM } from '../../../src/modules/culture-engine/embedding';

describe('embedding — tokenize', () => {
  it('minuscules, sans accents ni ponctuation, mots > 2 caractères', () => {
    expect(tokenize('Coucou, comment ça va ? À bientôt !')).toEqual(['coucou', 'comment', 'bientot']);
  });

  it('retourne [] pour un texte vide', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('gère les mots accentués', () => {
    expect(tokenize('Éléphant zèbre')).toEqual(['elephant', 'zebre']);
  });
});

describe('embedding — hashEmbedding', () => {
  it('est déterministe', () => {
    const tokens = ['musique', 'danse', 'liberte', 'afrique'];
    expect(hashEmbedding(tokens)).toEqual(hashEmbedding(tokens));
  });

  it('est normalisé L2 (norme ≈ 1)', () => {
    const v = hashEmbedding(['musique', 'danse', 'liberte', 'afrique', 'joie']);
    let norm = 0;
    for (const value of Object.values(v)) norm += value * value;
    expect(Math.sqrt(norm)).toBeCloseTo(1, 5);
  });

  it('ne dépasse jamais la dimension', () => {
    const v = hashEmbedding(['x', 'y', 'z', 'w', 'q']);
    for (const key of Object.keys(v)) {
      expect(Number(key)).toBeLessThan(EMBEDDING_DIM);
    }
  });

  it('est sparce : moins de dimensions que de tokens distincts', () => {
    const tokens = Array.from({ length: 100 }, (_, i) => `mot${i}`);
    const v = hashEmbedding(tokens);
    expect(Object.keys(v).length).toBeLessThan(new Set(tokens).size);
  });

  it('retourne {} pour une entrée vide', () => {
    expect(hashEmbedding([])).toEqual({});
  });

  it('reflète les proportions (normalisation L2)', () => {
    // Mêmes tokens, proportions différentes → vecteurs différents
    const balanced = hashEmbedding(['a', 'b']);
    const skewed = hashEmbedding(['a', 'a', 'b']);
    expect(balanced).not.toEqual(skewed);
    // L'ordre n'a pas d'importance
    expect(hashEmbedding(['a', 'b'])).toEqual(hashEmbedding(['b', 'a']));
  });
});

describe('embedding — cosineSimilarity', () => {
  it('vaut 1 pour des vecteurs identiques', () => {
    expect(cosineSimilarity({ '1': 1, '2': 0.5 }, { '1': 1, '2': 0.5 })).toBeCloseTo(1, 5);
  });

  it('vaut 0 pour des vecteurs orthogonaux', () => {
    expect(cosineSimilarity({ '1': 1 }, { '2': 1 })).toBe(0);
  });

  it('vaut 0 si un vecteur est vide', () => {
    expect(cosineSimilarity({}, { '1': 1 })).toBe(0);
  });

  it('est symétrique', () => {
    const a = { '1': 1, '2': 0.2, '3': 0.4 };
    const b = { '2': 0.9, '4': 1 };
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 5);
  });
});
