import { describe, expect, it } from 'vitest';
import { DELETE_CONFIRMATION, isDeleteConfirmed, redactForExport } from '../../../src/modules/users/account.export';

describe('redactForExport', () => {
  it('retire récursivement secrets, jetons et empreintes', () => {
    const out = redactForExport({
      id: 'u1',
      email: 'a@b.c',
      passwordHash: 'x',
      sessionToken: 'y',
      nested: { otpCode: '123', refreshToken: 'z', city: 'Cotonou' },
      list: [{ apiSecret: 's', name: 'ok' }],
    });
    expect(out).toEqual({ id: 'u1', email: 'a@b.c', nested: { city: 'Cotonou' }, list: [{ name: 'ok' }] });
  });

  it('convertit les dates en ISO et conserve les valeurs simples', () => {
    const d = new Date(Date.UTC(2026, 10, 27, 12, 0, 0));
    expect(redactForExport({ at: d, n: 3, b: false, nothing: null })).toEqual({ at: '2026-11-27T12:00:00.000Z', n: 3, b: false, nothing: null });
  });

  it('ne modifie pas l’objet d’origine', () => {
    const source = { token: 'x', keep: 1 };
    redactForExport(source);
    expect(source).toEqual({ token: 'x', keep: 1 });
  });
});

describe('isDeleteConfirmed', () => {
  it('accepte la phrase exacte, sans tenir compte de la casse ni des espaces autour', () => {
    expect(isDeleteConfirmed(DELETE_CONFIRMATION)).toBe(true);
    expect(isDeleteConfirmed('  supprimer mon compte ')).toBe(true);
  });

  it('refuse tout le reste', () => {
    expect(isDeleteConfirmed('oui')).toBe(false);
    expect(isDeleteConfirmed('')).toBe(false);
    expect(isDeleteConfirmed(undefined)).toBe(false);
    expect(isDeleteConfirmed(true)).toBe(false);
  });
});
