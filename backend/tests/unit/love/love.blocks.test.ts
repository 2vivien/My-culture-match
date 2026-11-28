import { describe, expect, it } from 'vitest';
import { counterpartsBlockedWith, loveCachesToInvalidate } from '../../../src/modules/love/love.blocks';

describe('counterpartsBlockedWith', () => {
  const rows = [
    { blockerId: 'a', blockedId: 'b' }, // a bloque b
    { blockerId: 'c', blockedId: 'a' }, // c bloque a : a ne doit plus voir c (et c ne doit plus voir a)
    { blockerId: 'x', blockedId: 'y' }, // sans rapport
  ];

  it('exclut les blocages dans les deux sens', () => {
    expect([...counterpartsBlockedWith('a', rows)].sort()).toEqual(['b', 'c']);
  });

  it('côté bloqué : B qui a bloqué A est exclu pour A', () => {
    expect(counterpartsBlockedWith('a', [{ blockerId: 'b', blockedId: 'a' }]).has('b')).toBe(true);
  });

  it('ne retient rien pour une personne non concernée', () => {
    expect(counterpartsBlockedWith('z', rows).size).toBe(0);
  });
});

describe('loveCachesToInvalidate', () => {
  it('invalide les suggestions des deux personnes', () => {
    expect(loveCachesToInvalidate('a', 'b')).toEqual(['love:candidates:a', 'love:candidates:b']);
  });
});
