import { describe, expect, it } from 'vitest';
import { blocksMembership, blocksWriting, canSanction, expiryFromDays, isSanctionActive } from '../../../src/modules/tribes/tribes.sanctions.policy';

describe('canSanction', () => {
  it('un modérateur sanctionne un membre mais pas un autre modérateur ni l’owner', () => {
    expect(canSanction('moderator', 'member', 'm1', 'u1')).toBe(true);
    expect(canSanction('moderator', 'moderator', 'm1', 'm2')).toBe(false);
    expect(canSanction('moderator', 'owner', 'm1', 'o1')).toBe(false);
  });

  it('l’owner sanctionne membres et modérateurs, jamais lui-même', () => {
    expect(canSanction('owner', 'member', 'o1', 'u1')).toBe(true);
    expect(canSanction('owner', 'moderator', 'o1', 'm1')).toBe(true);
    expect(canSanction('owner', 'owner', 'o1', 'o1')).toBe(false);
  });

  it('un simple membre ou un non-membre ne sanctionne personne', () => {
    expect(canSanction('member', 'member', 'u1', 'u2')).toBe(false);
    expect(canSanction(null, 'member', 'x', 'u2')).toBe(false);
  });

  it('on peut bannir un ancien membre (cible hors tribu), pas se sanctionner soi-même', () => {
    expect(canSanction('moderator', null, 'm1', 'u9')).toBe(true);
    expect(canSanction('moderator', 'member', 'm1', 'm1')).toBe(false);
  });
});

describe('durée des sanctions', () => {
  const now = Date.UTC(2026, 10, 27);

  it('une sanction sans expiration est permanente', () => {
    expect(isSanctionActive(null, now)).toBe(true);
  });

  it('une sanction expire à sa date', () => {
    expect(isSanctionActive(new Date(now + 1000), now)).toBe(true);
    expect(isSanctionActive(new Date(now), now)).toBe(false);
    expect(isSanctionActive(new Date(now - 1000), now)).toBe(false);
  });

  it('expiryFromDays convertit des jours, ou renvoie null (permanent)', () => {
    expect(expiryFromDays(undefined, now)).toBeNull();
    expect(expiryFromDays(7, now)?.getTime()).toBe(now + 7 * 86_400_000);
  });
});

describe('effets', () => {
  it('ban et mute bloquent l’écriture ; seul le ban bloque l’adhésion', () => {
    expect(blocksWriting('ban')).toBe(true);
    expect(blocksWriting('mute')).toBe(true);
    expect(blocksMembership('ban')).toBe(true);
    expect(blocksMembership('mute')).toBe(false);
  });
});
