import { describe, expect, it } from 'vitest';
// Logique pure du front (aucun DOM) : testée ici car le web n'a pas de runner unitaire.
import { PLACE_REPORT_REASONS, placeReportError, placeReportPayload } from '../../../../myculturematch-web/src/lib/placeReport';

describe('placeReportPayload', () => {
  it('cible un lieu et transmet « adresse privée » dans la description', () => {
    expect(placeReportPayload('p1', 'private_address')).toEqual({ targetType: 'place', targetId: 'p1', reason: 'other', description: 'adresse_privee' });
  });

  it('« spam » garde le motif spam, sans description', () => {
    expect(placeReportPayload('p1', 'spam')).toEqual({ targetType: 'place', targetId: 'p1', reason: 'spam' });
  });

  it('« autre » utilise le motif générique du serveur', () => {
    expect(placeReportPayload('p1', 'other')).toEqual({ targetType: 'place', targetId: 'p1', reason: 'other' });
  });

  it('n’emploie que des motifs acceptés par le serveur', () => {
    const accepted = ['harassment', 'spam', 'hate_speech', 'nsfw', 'violence', 'other'];
    for (const r of PLACE_REPORT_REASONS) expect(accepted).toContain(placeReportPayload('p', r.id).reason);
  });
});

describe('placeReportError', () => {
  it('traduit les codes connus et retombe sur un message générique', () => {
    expect(placeReportError('REPORT_DUPLICATE')).toContain('déjà signalé');
    expect(placeReportError('REPORT_TARGET_NOT_FOUND')).toContain('plus disponible');
    expect(placeReportError('')).toContain('Signalement impossible');
  });
});
