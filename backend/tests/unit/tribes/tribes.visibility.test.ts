import { describe, expect, it } from 'vitest';
import { canReadTribeContent } from '../../../src/modules/tribes/tribes.visibility';

describe('canReadTribeContent', () => {
  it('une tribu publique est lisible par tous', () => {
    expect(canReadTribeContent('public', false)).toBe(true);
    expect(canReadTribeContent('public', true)).toBe(true);
  });

  it('une tribu privée n’est lisible que par ses membres', () => {
    expect(canReadTribeContent('private', true)).toBe(true);
    expect(canReadTribeContent('private', false)).toBe(false);
  });

  it('une visibilité inconnue (ligne ancienne) reste traitée comme publique', () => {
    expect(canReadTribeContent('', false)).toBe(true);
  });
});
