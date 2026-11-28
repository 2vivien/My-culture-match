import { describe, it, expect } from 'vitest';
import {
  getJoinAction,
  joinResultMessage,
  visibilityLabel,
  canModerate,
  isTribePrivateError,
  safeFlairColor,
  isValidFlairColor,
  flairBadgeStyle,
  normalizeFlair,
  validateFlairName,
  FLAIR_DEFAULT_COLOR,
} from '../../../../myculturematch-web/src/lib/tribeAccess';

const base = { visibility: 'public', joined: false, requestPending: false, role: null } as const;

describe('getJoinAction', () => {
  it('tribu publique non rejointe : Rejoindre', () => {
    expect(getJoinAction(base)).toMatchObject({ kind: 'join', label: 'Rejoindre', disabled: false });
  });
  it('tribu privée : Demander à rejoindre', () => {
    expect(getJoinAction({ ...base, visibility: 'private' })).toMatchObject({ kind: 'request', label: 'Demander à rejoindre' });
  });
  it('tribu privée avec demande en attente : annuler', () => {
    expect(getJoinAction({ ...base, visibility: 'private', requestPending: true })).toMatchObject({
      kind: 'cancel-request',
      label: 'Demande envoyée — annuler',
    });
  });
  it('membre : Quitter (publique ou privée)', () => {
    expect(getJoinAction({ ...base, joined: true, role: 'member' }).kind).toBe('leave');
    expect(getJoinAction({ visibility: 'private', joined: true, requestPending: false, role: 'moderator' }).label).toBe('Quitter');
  });
  it('owner : ne peut pas quitter', () => {
    expect(getJoinAction({ ...base, joined: true, role: 'owner' })).toMatchObject({ kind: 'owner', disabled: true });
  });
  it('joined prime sur requestPending', () => {
    expect(getJoinAction({ visibility: 'private', joined: true, requestPending: true, role: 'member' }).kind).toBe('leave');
  });
});

describe('messages et rôles', () => {
  it('joinResultMessage', () => {
    expect(joinResultMessage({ joined: true })).toMatch(/rejoint/);
    expect(joinResultMessage({ joined: false, requested: true })).toMatch(/Demande envoyée/);
    expect(joinResultMessage({ joined: false })).toMatch(/déjà membre/);
  });
  it('visibilityLabel', () => {
    expect(visibilityLabel('private')).toBe('Privée');
    expect(visibilityLabel('public')).toBe('Publique');
    expect(visibilityLabel(undefined)).toBe('Publique');
  });
  it('canModerate', () => {
    expect(canModerate('owner')).toBe(true);
    expect(canModerate('moderator')).toBe(true);
    expect(canModerate('member')).toBe(false);
    expect(canModerate(null)).toBe(false);
  });
  it('isTribePrivateError', () => {
    expect(isTribePrivateError({ status: 403, code: 'TRIBE_PRIVATE' })).toBe(true);
    expect(isTribePrivateError({ status: 403, code: 'FORBIDDEN' })).toBe(false);
    expect(isTribePrivateError(new Error('x'))).toBe(false);
    expect(isTribePrivateError(null)).toBe(false);
  });
});

describe('couleur de flair (anti-injection CSS)', () => {
  it('accepte #RRGGBB uniquement', () => {
    expect(isValidFlairColor('#E27D60')).toBe(true);
    expect(isValidFlairColor('#e27d60')).toBe(true);
    expect(isValidFlairColor('#FFF')).toBe(false);
    expect(isValidFlairColor('red')).toBe(false);
    expect(isValidFlairColor('#E27D60; background:url(x)')).toBe(false);
    expect(isValidFlairColor('#E27D60\n')).toBe(false);
    expect(isValidFlairColor(undefined)).toBe(false);
  });
  it('safeFlairColor retombe sur la couleur par défaut', () => {
    expect(safeFlairColor('#112233')).toBe('#112233');
    expect(safeFlairColor('url(javascript:alert(1))')).toBe(FLAIR_DEFAULT_COLOR);
    expect(safeFlairColor(42)).toBe(FLAIR_DEFAULT_COLOR);
  });
  it('flairBadgeStyle n’émet que des hex validés', () => {
    expect(flairBadgeStyle('#112233')).toEqual({ color: '#112233', backgroundColor: '#1122331F', borderColor: '#11223366' });
    const bad = flairBadgeStyle('expression(alert(1))');
    for (const v of Object.values(bad)) expect(v).toMatch(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);
  });
});

describe('flairs', () => {
  it('normalizeFlair assainit la couleur et rejette les formes invalides', () => {
    expect(normalizeFlair({ id: 'f1', name: 'Recette', color: '#00FF00' })).toEqual({ id: 'f1', name: 'Recette', color: '#00FF00' });
    expect(normalizeFlair({ id: 'f1', name: 'Recette', color: 'x' })?.color).toBe(FLAIR_DEFAULT_COLOR);
    expect(normalizeFlair(null)).toBeNull();
    expect(normalizeFlair({ id: '', name: 'a' })).toBeNull();
    expect(normalizeFlair({ id: 'f', name: '  ' })).toBeNull();
  });
  it('validateFlairName', () => {
    expect(validateFlairName('a')).toMatch(/2 caractères/);
    expect(validateFlairName(' ab ')).toBeNull();
    expect(validateFlairName('x'.repeat(25))).toMatch(/24 caractères/);
  });
});
