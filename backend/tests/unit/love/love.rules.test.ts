import { describe, expect, it } from 'vitest';
import { computeAge, isAdultForLove } from '../../../src/modules/love/love.rules';

const now = new Date('2026-06-15T12:00:00Z');

describe('computeAge', () => {
  it('compte les années révolues (anniversaire pas encore atteint)', () => {
    expect(computeAge(new Date('2000-06-16T00:00:00Z'), now)).toBe(25);
    expect(computeAge(new Date('2000-06-15T00:00:00Z'), now)).toBe(26);
    expect(computeAge(new Date('2000-06-14T00:00:00Z'), now)).toBe(26);
  });

  it('retourne null sans date, avec une date invalide ou future', () => {
    expect(computeAge(null, now)).toBeNull();
    expect(computeAge(undefined, now)).toBeNull();
    expect(computeAge(new Date('nope'), now)).toBeNull();
    expect(computeAge(new Date('2030-01-01'), now)).toBeNull();
  });
});

describe('isAdultForLove', () => {
  it('refuse un mineur, y compris la veille des 18 ans', () => {
    expect(isAdultForLove(new Date('2008-06-16T00:00:00Z'), now)).toBe(false);
    expect(isAdultForLove(new Date('2015-01-01T00:00:00Z'), now)).toBe(false);
  });

  it('accepte le jour des 18 ans et au-delà', () => {
    expect(isAdultForLove(new Date('2008-06-15T00:00:00Z'), now)).toBe(true);
    expect(isAdultForLove(new Date('1990-01-01T00:00:00Z'), now)).toBe(true);
  });

  it('refuse un compte sans date de naissance', () => {
    expect(isAdultForLove(null, now)).toBe(false);
    expect(isAdultForLove(undefined, now)).toBe(false);
  });
});
