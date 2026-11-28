import { describe, expect, it } from 'vitest';
import { detectSensitiveCategories, sensitiveNotice, stripSensitiveKeywords } from '../../../src/modules/love/love.guardrails';

describe('detectSensitiveCategories', () => {
  it('détecte religion, santé, orientation, politique et couleur de peau (avec accents)', () => {
    expect(detectSensitiveCategories('Je cherche une femme musulmane')).toEqual(['religion']);
    expect(detectSensitiveCategories('quelqu’un sans handicap')).toEqual(['santé']);
    expect(detectSensitiveCategories('un homme gay')).toEqual(['orientation']);
    expect(detectSensitiveCategories('plutôt de gauche')).toEqual(['opinions politiques']);
    expect(detectSensitiveCategories('une fille à la peau claire')).toEqual(['couleur de peau']);
    expect(detectSensitiveCategories('une femme chrétienne et conservatrice')).toEqual(['religion', 'opinions politiques']);
  });

  it('laisse passer les critères culturels et de personnalité', () => {
    expect(detectSensitiveCategories('Une femme entre 24 et 30 ans, ouverte d’esprit, aime voyager, originaire du Bénin')).toEqual([]);
    expect(detectSensitiveCategories('passionnée de musique et de cuisine, parle fon et français')).toEqual([]);
  });

  it('ne se déclenche pas sur des mots voisins (« bien », « blanchisserie » exclue ici par frontière de mot)', () => {
    expect(detectSensitiveCategories('je cherche un bon équilibre')).toEqual([]);
  });
});

describe('stripSensitiveKeywords', () => {
  it('retire les mots-clés sensibles et garde les autres', () => {
    expect(stripSensitiveKeywords(['voyage', 'musulmane', 'cuisine', 'handicap'])).toEqual(['voyage', 'cuisine']);
    expect(stripSensitiveKeywords(undefined)).toEqual([]);
  });
});

describe('sensitiveNotice', () => {
  it('est vide sans catégorie et liste les catégories sinon', () => {
    expect(sensitiveNotice([])).toBe('');
    expect(sensitiveNotice(['religion', 'santé'])).toContain('religion, santé');
  });
});
