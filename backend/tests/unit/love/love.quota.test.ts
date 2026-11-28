import { describe, expect, it } from 'vitest';
import { evaluateQuota, loveQuotaKey, quotaExceededMessage, secondsUntilMidnightUtc, utcDayStamp } from '../../../src/modules/love/love.quota';

describe('evaluateQuota', () => {
  it('0 = illimité : jamais dépassé, restant null', () => {
    const s = evaluateQuota(9999, 0);
    expect(s).toMatchObject({ unlimited: true, exceeded: false, remaining: null, limit: 0 });
  });
  it('compte le restant', () => {
    expect(evaluateQuota(5, 20)).toMatchObject({ used: 5, remaining: 15, exceeded: false });
  });
  it('atteindre le plafond n’est pas le dépasser', () => {
    expect(evaluateQuota(20, 20)).toMatchObject({ remaining: 0, exceeded: false });
    expect(evaluateQuota(21, 20)).toMatchObject({ remaining: 0, used: 20, exceeded: true });
  });
  it('tolère des valeurs invalides (limite négative/NaN = illimité)', () => {
    expect(evaluateQuota(1, -3).unlimited).toBe(true);
    expect(evaluateQuota(1, Number.NaN).unlimited).toBe(true);
  });
});

describe('fenêtre quotidienne UTC', () => {
  it('calcule le TTL jusqu’à minuit UTC', () => {
    expect(secondsUntilMidnightUtc(new Date('2026-11-27T23:59:00Z'))).toBe(60);
    expect(secondsUntilMidnightUtc(new Date('2026-11-27T00:00:00Z'))).toBe(86400);
  });
  it('ne renvoie jamais moins de 1 seconde', () => {
    expect(secondsUntilMidnightUtc(new Date('2026-11-27T23:59:59.999Z'))).toBe(1);
  });
  it('change de clé à minuit UTC et sépare recherches / requêtes', () => {
    const a = loveQuotaKey('search', 'u1', new Date('2026-11-27T23:59:59Z'));
    const b = loveQuotaKey('search', 'u1', new Date('2026-11-28T00:00:01Z'));
    expect(a).not.toBe(b);
    expect(utcDayStamp(new Date('2026-11-28T00:00:01Z'))).toBe('2026-11-28');
    expect(loveQuotaKey('request', 'u1', new Date('2026-11-27T10:00:00Z'))).not.toBe(loveQuotaKey('search', 'u1', new Date('2026-11-27T10:00:00Z')));
  });
});

describe('quotaExceededMessage', () => {
  it('est en français, explicite et accorde le pluriel', () => {
    expect(quotaExceededMessage('search', 20)).toContain('20 recherches IA');
    expect(quotaExceededMessage('request', 1)).toContain('1 requête Love');
    expect(quotaExceededMessage('request', 30)).toContain('minuit (UTC)');
  });
});
