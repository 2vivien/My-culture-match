import { describe, expect, it } from 'vitest';
import { chooseTribeSuccessor, planTribeSuccession, type SuccessionMember } from '../../../src/modules/users/account.tribes';

const d = (day: number) => new Date(Date.UTC(2025, 0, day));
const m = (userId: string, role: SuccessionMember['role'], day: number): SuccessionMember => ({ userId, role, joinedAt: d(day) });

describe('chooseTribeSuccessor', () => {
  it('choisit le plus ancien modérateur, même si un simple membre est plus ancien', () => {
    expect(chooseTribeSuccessor('o', [m('o', 'owner', 1), m('a', 'member', 2), m('b', 'moderator', 9), m('c', 'moderator', 5)])).toBe('c');
  });

  it('à défaut de modérateur, choisit le plus ancien membre', () => {
    expect(chooseTribeSuccessor('o', [m('o', 'owner', 1), m('a', 'member', 8), m('b', 'member', 3)])).toBe('b');
  });

  it('ne choisit jamais la personne qui part', () => {
    expect(chooseTribeSuccessor('o', [m('o', 'owner', 1)])).toBeNull();
    expect(chooseTribeSuccessor('o', [])).toBeNull();
  });

  it('départage deux anciennetés égales de façon déterministe', () => {
    expect(chooseTribeSuccessor('o', [m('o', 'owner', 1), m('z', 'member', 2), m('b', 'member', 2)])).toBe('b');
  });

  it('ne modifie pas la liste reçue', () => {
    const list = [m('o', 'owner', 1), m('a', 'member', 5), m('b', 'member', 2)];
    chooseTribeSuccessor('o', list);
    expect(list.map((x) => x.userId)).toEqual(['o', 'a', 'b']);
  });
});

describe('planTribeSuccession', () => {
  it('transfère sans masquer les posts quand un successeur existe', () => {
    expect(planTribeSuccession('o', [m('o', 'owner', 1), m('a', 'member', 2)])).toEqual({ successorId: 'a', hidePosts: false });
  });

  it('masque les posts quand personne ne peut reprendre la tribu (jamais de posts orphelins publics)', () => {
    expect(planTribeSuccession('o', [m('o', 'owner', 1)])).toEqual({ successorId: null, hidePosts: true });
  });
});
