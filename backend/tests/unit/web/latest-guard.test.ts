import { describe, expect, it } from 'vitest';
import { createLatestGuard } from '../../../../myculturematch-web/src/lib/latestGuard';

describe('createLatestGuard', () => {
  it('une réponse lente de l’ancienne zone est ignorée (Paris puis Lyon)', () => {
    const g = createLatestGuard();
    const paris = g.begin();
    const lyon = g.begin();
    expect(paris()).toBe(false);
    expect(lyon()).toBe(true);
  });
  it('cancel invalide la requête en vol', () => {
    const g = createLatestGuard();
    const r = g.begin();
    g.cancel();
    expect(r()).toBe(false);
  });
});
