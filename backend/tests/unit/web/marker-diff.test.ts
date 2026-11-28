import { describe, expect, it } from 'vitest';
import { diffMarkerKeys } from '../../../../myculturematch-web/src/lib/markerDiff';

describe('diffMarkerKeys', () => {
  it('ne recrée que ce qui change', () => {
    expect(diffMarkerKeys(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual({ add: ['d'], remove: ['a'] });
  });
  it('rien à faire quand tout est identique', () => {
    expect(diffMarkerKeys(['a'], ['a'])).toEqual({ add: [], remove: [] });
  });
  it('tout créer depuis un état vide, tout retirer vers une liste vide', () => {
    expect(diffMarkerKeys([], ['a', 'b'])).toEqual({ add: ['a', 'b'], remove: [] });
    expect(diffMarkerKeys(['a', 'b'], [])).toEqual({ add: [], remove: ['a', 'b'] });
  });
  it('une clé en double n’est créée qu’une fois', () => {
    expect(diffMarkerKeys([], ['a', 'a']).add).toEqual(['a']);
  });
});
