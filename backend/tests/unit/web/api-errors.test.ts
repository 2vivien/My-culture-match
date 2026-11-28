import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from '../../../../myculturematch-web/src/lib/apiErrors';

const apiErr = (status: number, code = 'API_ERROR', message = 'API request failed') => ({ status, code, message });

describe('apiErrorMessage', () => {
  it('messages dédiés 401/403/404/409/429', () => {
    const msgs = [401, 403, 404, 409, 429].map((s) => apiErrorMessage(apiErr(s), 'x'));
    expect(new Set(msgs).size).toBe(5);
    for (const m of msgs) expect(m).not.toBe('x');
  });
  it('message du serveur quand il est structuré', () => {
    expect(apiErrorMessage(apiErr(422, 'EVENT_FULL', 'Événement complet'), 'x')).toBe('Événement complet');
  });
  it('message technique par défaut remplacé par le repli', () => {
    expect(apiErrorMessage(apiErr(500), 'Impossible')).toBe('Impossible');
  });
  it('panne réseau', () => {
    expect(apiErrorMessage(new TypeError('Failed to fetch'), 'x')).toContain('Connexion');
  });
});
