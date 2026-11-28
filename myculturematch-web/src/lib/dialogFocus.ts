/** Logique pure de la gestion du focus des boîtes de dialogue (piège de Tab, empilement). */

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Cible du focus quand l'utilisateur presse Tab (ou Maj+Tab) : on ne boucle qu'aux extrémités.
 * `current` vaut -1 quand le focus n'est sur aucun élément de la liste (le conteneur lui-même, par exemple).
 * Retourne `null` quand le navigateur peut avancer normalement, -1 quand il n'y a rien à focaliser.
 */
export function wrapFocusTarget(count: number, current: number, shift: boolean): number | null {
  if (count <= 0) return -1;
  if (current < 0 || current >= count) return shift ? count - 1 : 0;
  if (shift && current === 0) return count - 1;
  if (!shift && current === count - 1) return 0;
  return null;
}

/** Pile des dialogues ouverts : seul le dernier ouvert réagit à Échap et au piège de Tab. */
export function createDialogStack() {
  const ids: symbol[] = [];
  return {
    push(id: symbol): void {
      ids.push(id);
    },
    remove(id: symbol): void {
      const i = ids.indexOf(id);
      if (i >= 0) ids.splice(i, 1);
    },
    isTop(id: symbol): boolean {
      return ids.length > 0 && ids[ids.length - 1] === id;
    },
    get size(): number {
      return ids.length;
    },
  };
}
