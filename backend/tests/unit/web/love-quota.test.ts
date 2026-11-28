import { describe, expect, it } from 'vitest';
import { isQuotaExhausted } from '../../../../myculturematch-web/src/lib/loveQuota';

describe('isQuotaExhausted', () => {
  it('est épuisé uniquement à 0', () => {
    expect(isQuotaExhausted({ remaining: 0 })).toBe(true);
  });
  it('« illimité » (-1) n’est jamais épuisé', () => {
    expect(isQuotaExhausted({ remaining: -1 })).toBe(false);
  });
  it('reste utilisable avec des recherches restantes', () => {
    expect(isQuotaExhausted({ remaining: 3 })).toBe(false);
  });
});
