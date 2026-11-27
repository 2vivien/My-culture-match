import { describe, expect, it } from 'vitest';
import { createFlairSchema, setPostFlairSchema } from '../../../src/modules/tribes/tribes.schemas';

describe('createFlairSchema', () => {
  it('accepte un nom et une couleur hexadécimale', () => {
    expect(createFlairSchema.parse({ name: 'Question', color: '#1a2B3c' })).toEqual({ name: 'Question', color: '#1a2B3c' });
  });

  it('applique la couleur par défaut et rogne le nom', () => {
    expect(createFlairSchema.parse({ name: '  Débat  ' })).toEqual({ name: 'Débat', color: '#E27D60' });
  });

  it('refuse un nom trop court ou trop long', () => {
    expect(createFlairSchema.safeParse({ name: 'a' }).success).toBe(false);
    expect(createFlairSchema.safeParse({ name: 'x'.repeat(25) }).success).toBe(false);
  });

  it('refuse une couleur invalide (pas de CSS arbitraire) et les champs inconnus', () => {
    expect(createFlairSchema.safeParse({ name: 'Ok', color: 'red' }).success).toBe(false);
    expect(createFlairSchema.safeParse({ name: 'Ok', color: 'url(javascript:alert(1))' }).success).toBe(false);
    expect(createFlairSchema.safeParse({ name: 'Ok', extra: 1 }).success).toBe(false);
  });
});

describe('setPostFlairSchema', () => {
  it('accepte un identifiant ou null (retrait)', () => {
    expect(setPostFlairSchema.safeParse({ flairId: 'abc' }).success).toBe(true);
    expect(setPostFlairSchema.safeParse({ flairId: null }).success).toBe(true);
  });

  it('refuse une chaîne vide ou l’absence du champ', () => {
    expect(setPostFlairSchema.safeParse({ flairId: '' }).success).toBe(false);
    expect(setPostFlairSchema.safeParse({}).success).toBe(false);
  });
});
