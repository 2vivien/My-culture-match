import { describe, expect, it } from 'vitest';
import { createDialogStack, wrapFocusTarget } from '../../../../myculturematch-web/src/lib/dialogFocus';

describe('wrapFocusTarget', () => {
  it('Tab sur le dernier élément revient au premier', () => {
    expect(wrapFocusTarget(3, 2, false)).toBe(0);
  });
  it('Maj+Tab sur le premier va au dernier', () => {
    expect(wrapFocusTarget(3, 0, true)).toBe(2);
  });
  it('au milieu, le navigateur avance normalement', () => {
    expect(wrapFocusTarget(3, 1, false)).toBeNull();
    expect(wrapFocusTarget(3, 1, true)).toBeNull();
  });
  it('focus hors liste : on rentre dans la boîte', () => {
    expect(wrapFocusTarget(3, -1, false)).toBe(0);
    expect(wrapFocusTarget(3, -1, true)).toBe(2);
  });
  it('rien de focalisable : -1 (focus sur le conteneur)', () => {
    expect(wrapFocusTarget(0, -1, false)).toBe(-1);
  });
});

describe('createDialogStack', () => {
  it('seul le dernier dialogue ouvert est actif', () => {
    const st = createDialogStack();
    const a = Symbol('a'), b = Symbol('b');
    st.push(a); st.push(b);
    expect(st.isTop(b)).toBe(true);
    expect(st.isTop(a)).toBe(false);
    st.remove(b);
    expect(st.isTop(a)).toBe(true);
    st.remove(a);
    expect(st.size).toBe(0);
  });
});
