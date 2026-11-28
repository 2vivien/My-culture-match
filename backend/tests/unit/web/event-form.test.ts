import { describe, expect, it } from 'vitest';
// Logique pure du front (aucun DOM) : testée ici car le web n'a pas de runner unitaire.
import { eventErrorMessage, formatEventDate, toIsoFromLocalInput } from '../../../../myculturematch-web/src/lib/eventForm';

describe('toIsoFromLocalInput', () => {
  it('convertit une heure locale en ISO 8601 avec fuseau', () => {
    const iso = toIsoFromLocalInput('2026-12-05T18:30');
    expect(iso).toBe(new Date('2026-12-05T18:30').toISOString());
    expect(iso).toMatch(/Z$/);
  });

  it('renvoie null pour une valeur vide ou invalide', () => {
    expect(toIsoFromLocalInput('')).toBeNull();
    expect(toIsoFromLocalInput('pas une date')).toBeNull();
  });
});

describe('eventErrorMessage', () => {
  it('traduit les codes connus du serveur', () => {
    expect(eventErrorMessage('EVENT_PUBLIC_REQUIRES_PUBLISHED_PLACE')).toContain('lieu culturel');
    expect(eventErrorMessage('EVENT_START_IN_PAST')).toContain('passé');
    expect(eventErrorMessage('EVENT_UPCOMING_LIMIT')).toContain('10');
  });

  it('retombe sur un message générique pour un code inconnu ou vide', () => {
    expect(eventErrorMessage('')).toContain('Création impossible');
    expect(eventErrorMessage('N_IMPORTE_QUOI')).toContain('Création impossible');
  });
});

describe('formatEventDate', () => {
  it('formate une date valide en français et renvoie une chaîne vide sinon', () => {
    expect(formatEventDate('2026-12-05T18:30:00Z').length).toBeGreaterThan(5);
    expect(formatEventDate('invalide')).toBe('');
  });
});
