import { describe, expect, it } from 'vitest';
import { cleanPlaceLabel, evaluateStoryMarker, PLACE_CELL_DEGREES, snapToGrid, type StoryMarkerInput } from '../../../src/modules/stories/stories.place';

describe('snapToGrid', () => {
  it('ramène deux points d’une même cellule à la même position', () => {
    const a = snapToGrid({ latitude: 6.3712, longitude: 2.3911 });
    const b = snapToGrid({ latitude: 6.3799, longitude: 2.3999 });
    expect(a).toEqual(b);
  });

  it('place le point au centre de la cellule, jamais sur le point d’origine', () => {
    const exact = { latitude: 6.37123, longitude: 2.39117 };
    const snapped = snapToGrid(exact);
    expect(snapped).not.toEqual(exact);
    const cell = PLACE_CELL_DEGREES.approximate;
    expect(Math.abs(snapped.latitude - exact.latitude)).toBeLessThanOrEqual(cell / 2 + 1e-9);
    expect(Math.abs(snapped.longitude - exact.longitude)).toBeLessThanOrEqual(cell / 2 + 1e-9);
  });

  it('la précision « area » est plus grossière', () => {
    const exact = { latitude: 6.37123, longitude: 2.39117 };
    const a = snapToGrid(exact, 'approximate');
    const b = snapToGrid(exact, 'area');
    expect(Math.abs(b.latitude - exact.latitude) + Math.abs(b.longitude - exact.longitude)).toBeGreaterThan(0);
    expect(PLACE_CELL_DEGREES.area).toBeGreaterThan(PLACE_CELL_DEGREES.approximate);
    expect(a).not.toEqual(b);
  });

  it('est idempotent : un point déjà au centre ne bouge pas', () => {
    const once = snapToGrid({ latitude: 6.37123, longitude: 2.39117 });
    expect(snapToGrid(once)).toEqual(once);
  });

  it('gère les coordonnées négatives et reste dans les bornes', () => {
    const s = snapToGrid({ latitude: -33.8688, longitude: -151.2093 });
    expect(s.latitude).toBeGreaterThanOrEqual(-90);
    expect(s.longitude).toBeGreaterThanOrEqual(-180);
    const pole = snapToGrid({ latitude: 90, longitude: 180 });
    expect(pole.latitude).toBeLessThanOrEqual(90);
    expect(pole.longitude).toBeLessThanOrEqual(180);
  });
});

describe('cleanPlaceLabel', () => {
  it('normalise les espaces et tronque', () => {
    expect(cleanPlaceLabel('  Marché   Dantokpa \n')).toBe('Marché Dantokpa');
    expect(cleanPlaceLabel('x'.repeat(200))?.length).toBe(80);
  });

  it('renvoie null pour un libellé vide ou absent', () => {
    expect(cleanPlaceLabel('   ')).toBeNull();
    expect(cleanPlaceLabel(undefined)).toBeNull();
    expect(cleanPlaceLabel(null)).toBeNull();
  });
});

const future = new Date(Date.now() + 3600_000);
const base = (over: Partial<StoryMarkerInput> = {}, authorOver: Partial<StoryMarkerInput['author']> = {}, storyOver: Partial<StoryMarkerInput['story']> = {}): StoryMarkerInput => ({
  viewerId: 'viewer',
  story: { authorId: 'author', placeLat: 6.37, placeLon: 2.39, expiresAt: future, ...storyOver },
  author: { sharingEnabled: true, visibility: 'friends', audienceMode: 'default', ghost: false, locationExpiresAt: null, ...authorOver },
  relations: { friendIds: new Set(['author']), friendOfFriendIds: new Set(), blockedIds: new Set(), listedByIds: new Set() },
  distanceKm: 3,
  ...over,
});

describe('evaluateStoryMarker', () => {
  it('visible pour un compagnon, avec la visibilité « amis »', () => {
    expect(evaluateStoryMarker(base())).toEqual({ visible: true });
  });

  it('une story expirée n’apparaît plus', () => {
    expect(evaluateStoryMarker(base({}, {}, { expiresAt: new Date(Date.now() - 1) }))).toEqual({ visible: false, reason: 'expired' });
  });

  it('partage de position désactivé chez l’auteur : aucun marqueur', () => {
    expect(evaluateStoryMarker(base({}, { sharingEnabled: false }))).toEqual({ visible: false, reason: 'sharing_off' });
  });

  it('le mode fantôme ne peut pas être contourné par une story', () => {
    expect(evaluateStoryMarker(base({}, { ghost: true }))).toMatchObject({ visible: false, reason: 'hidden' });
  });

  it('le partage de position expiré masque aussi les marqueurs', () => {
    expect(evaluateStoryMarker(base({}, { locationExpiresAt: new Date(Date.now() - 1000) }))).toMatchObject({ visible: false, reason: 'hidden' });
  });

  it('visibilité « personne » : aucun marqueur, même pour un compagnon listé', () => {
    const input = base({ relations: { friendIds: new Set(['author']), friendOfFriendIds: new Set(), blockedIds: new Set(), listedByIds: new Set(['author']) } }, { visibility: 'nobody', audienceMode: 'selected' });
    expect(evaluateStoryMarker(input)).toEqual({ visible: false, reason: 'nobody' });
  });

  it('un étranger ne voit pas la story d’un auteur « amis »', () => {
    const input = base({ relations: { friendIds: new Set(), friendOfFriendIds: new Set(), blockedIds: new Set(), listedByIds: new Set() } });
    expect(evaluateStoryMarker(input)).toMatchObject({ visible: false, reason: 'not_allowed' });
  });

  it('un utilisateur bloqué ne voit rien, dans le sens où le blocage est enregistré', () => {
    const input = base({ relations: { friendIds: new Set(['author']), friendOfFriendIds: new Set(), blockedIds: new Set(['author']), listedByIds: new Set() } });
    expect(evaluateStoryMarker(input)).toMatchObject({ visible: false, reason: 'blocked' });
  });

  it('audience « sélection » : seul un compagnon listé voit la story', () => {
    const listed = base({ relations: { friendIds: new Set(['author']), friendOfFriendIds: new Set(), blockedIds: new Set(), listedByIds: new Set(['author']) } }, { audienceMode: 'selected' });
    const notListed = base({}, { audienceMode: 'selected' });
    expect(evaluateStoryMarker(listed)).toEqual({ visible: true });
    expect(evaluateStoryMarker(notListed)).toMatchObject({ visible: false, reason: 'not_allowed' });
  });

  it('audience « tous sauf » : la personne listée ne voit pas la story', () => {
    const input = base({ relations: { friendIds: new Set(['author']), friendOfFriendIds: new Set(), blockedIds: new Set(), listedByIds: new Set(['author']) } }, { audienceMode: 'except' });
    expect(evaluateStoryMarker(input)).toMatchObject({ visible: false, reason: 'not_allowed' });
  });

  it('une story sans lieu ou hors du rayon n’apparaît pas', () => {
    expect(evaluateStoryMarker(base({}, {}, { placeLat: null, placeLon: null }))).toMatchObject({ visible: false, reason: 'no_coordinates' });
    expect(evaluateStoryMarker(base({ distanceKm: 80 }))).toMatchObject({ visible: false, reason: 'out_of_range' });
  });

  it('l’auteur ne voit pas son propre marqueur comme celui d’un autre', () => {
    expect(evaluateStoryMarker(base({ viewerId: 'author' }))).toMatchObject({ visible: false, reason: 'self' });
  });
});
