import { describe, expect, it } from 'vitest';
import { canDiscoverUser, shouldHideLocation } from '../../../src/modules/location/location.policy';

describe('People Nearby privacy policy', () => {
  it('never exposes users who selected Only me', () => {
    expect(canDiscoverUser('nobody', true, true)).toBe(false);
  });

  it('friends visibility only accepts direct companions', () => {
    expect(canDiscoverUser('friends', true, false)).toBe(true);
    expect(canDiscoverUser('friends', false, true)).toBe(false);
  });

  it('friends of friends accepts direct friends and second-degree users', () => {
    expect(canDiscoverUser('friends_of_friends', true, false)).toBe(true);
    expect(canDiscoverUser('friends_of_friends', false, true)).toBe(true);
    expect(canDiscoverUser('friends_of_friends', false, false)).toBe(false);
  });

  it('nearby and everyone remain discoverable when location is otherwise allowed', () => {
    expect(canDiscoverUser('nearby', false, false)).toBe(true);
    expect(canDiscoverUser('everyone', false, false)).toBe(true);
  });

  it('ghost mode always hides a location', () => {
    expect(shouldHideLocation({ sharingEnabled: true, ghostMode: true, expiresAt: null })).toBe(true);
  });

  it('disabled sharing always hides a location', () => {
    expect(shouldHideLocation({ sharingEnabled: false, ghostMode: false, expiresAt: null })).toBe(true);
  });

  it('expired temporary sharing hides a location', () => {
    const now = Date.now();
    expect(shouldHideLocation({ sharingEnabled: true, ghostMode: false, expiresAt: new Date(now - 1000) }, now)).toBe(true);
  });

  it('active temporary sharing remains visible', () => {
    const now = Date.now();
    expect(shouldHideLocation({ sharingEnabled: true, ghostMode: false, expiresAt: new Date(now + 60_000) }, now)).toBe(false);
  });
});
