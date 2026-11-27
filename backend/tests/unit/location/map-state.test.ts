import { afterEach, describe, expect, it, vi } from 'vitest';
// Logique pure du front (aucun DOM) : testée ici car le web n'a pas encore de runner unitaire.
import { classifyGeoError, computeMapStatus, GEO_MESSAGES } from '../../../../myculturematch-web/src/lib/mapState';

const base = { loading: false, failed: false, sharingEnabled: true, ghostMode: false, visibleCount: 3 };

describe('computeMapStatus', () => {
  it('prêt quand il y a des personnes visibles', () => {
    expect(computeMapStatus(base)).toBe('ready');
  });

  it('vide quand le partage est actif mais personne n’est visible', () => {
    expect(computeMapStatus({ ...base, visibleCount: 0 })).toBe('empty');
  });

  it('le chargement prime sur tout le reste', () => {
    expect(computeMapStatus({ ...base, loading: true, failed: true, visibleCount: 0 })).toBe('loading');
  });

  it('une erreur n’est jamais présentée comme un état vide', () => {
    expect(computeMapStatus({ ...base, failed: true, visibleCount: 0 })).toBe('error');
  });

  it('mode fantôme et partage désactivé ont leur propre état', () => {
    expect(computeMapStatus({ ...base, ghostMode: true })).toBe('ghost');
    expect(computeMapStatus({ ...base, sharingEnabled: false, visibleCount: 0 })).toBe('not-sharing');
  });
});

describe('classifyGeoError', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reconnaît les codes de GeolocationPositionError', () => {
    vi.stubGlobal('navigator', { geolocation: {} });
    expect(classifyGeoError({ code: 1 })).toBe('denied');
    expect(classifyGeoError({ code: 2 })).toBe('unavailable');
    expect(classifyGeoError({ code: 3 })).toBe('timeout');
  });

  it('retombe sur « unknown » pour une erreur inconnue ou un code texte (erreur d’API)', () => {
    vi.stubGlobal('navigator', { geolocation: {} });
    expect(classifyGeoError(new Error('x'))).toBe('unknown');
    expect(classifyGeoError({ code: 'LOCATION_CONSENT_REQUIRED' })).toBe('unknown');
    expect(classifyGeoError(null)).toBe('unknown');
  });

  it('signale un navigateur sans géolocalisation', () => {
    vi.stubGlobal('navigator', {});
    expect(classifyGeoError({ code: 1 })).toBe('unsupported');
  });

  it('chaque problème a un message en français', () => {
    for (const key of ['denied', 'unavailable', 'timeout', 'unsupported', 'unknown'] as const) {
      expect(GEO_MESSAGES[key].title.length).toBeGreaterThan(5);
      expect(GEO_MESSAGES[key].hint.length).toBeGreaterThan(10);
    }
  });
});
