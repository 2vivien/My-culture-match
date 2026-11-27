import { describe, expect, it } from 'vitest';
import { DELETE_CONFIRMATION, EXPORT_SECTIONS, isDeleteConfirmed, redactForExport, shapeLoveProfileForExport } from '../../../src/modules/users/account.export';

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

describe('profil Love dans l’export', () => {
  const answers = { goals: ['serious'], relationship: 'slow', values: ['respect', 'honesty', 'family'], lifestyle: ['travel', 'music', 'art', 'cinema', 'nature'], distance: 'km50', understood: 'Je cherche du sincère' };

  it('est une section de l’export', () => {
    expect(EXPORT_SECTIONS).toContain('loveProfile');
  });

  it('renvoie null si le questionnaire n’a jamais été rempli', () => {
    expect(shapeLoveProfileForExport(undefined)).toBeNull();
    expect(shapeLoveProfileForExport(null)).toBeNull();
  });

  it('ne garde que les réponses et les dates (liste blanche), sans autre colonne', () => {
    const created = new Date(Date.UTC(2026, 0, 2));
    const shaped = shapeLoveProfileForExport({ answers, createdAt: created, updatedAt: created, userId: 'u1', otherUserMessages: ['secret d’un tiers'] });
    expect(shaped).toEqual({ answers, createdAt: created, updatedAt: created });
    expect(JSON.stringify(shaped)).not.toContain('tiers');
  });

  it('survit à redactForExport : réponses intactes, dates en ISO', () => {
    const d = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));
    const out = redactForExport({ loveProfile: shapeLoveProfileForExport({ answers, createdAt: d, updatedAt: d }) });
    expect(out.loveProfile).toEqual({ answers, createdAt: '2026-01-02T03:04:05.000Z', updatedAt: '2026-01-02T03:04:05.000Z' });
  });

  it('redactForExport retire toujours un champ sensible qui s’y glisserait', () => {
    const out = redactForExport({ loveProfile: shapeLoveProfileForExport({ answers: { ...answers, apiToken: 'x' } }) });
    expect(JSON.stringify(out)).not.toContain('apiToken');
  });
});
