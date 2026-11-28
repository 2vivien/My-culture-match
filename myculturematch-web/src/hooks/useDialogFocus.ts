import { useEffect, useRef } from 'react';
import { FOCUSABLE_SELECTOR, createDialogStack, wrapFocusTarget } from '@/src/lib/dialogFocus';

const stack = createDialogStack();

/**
 * Gestion du focus d'une boîte de dialogue modale : focus initial à l'ouverture (élément `data-autofocus`, sinon le
 * premier élément focalisable), Tab piégé dans la boîte, Échap pour fermer, retour du focus à l'élément qui l'avait
 * avant l'ouverture. Avec plusieurs dialogues empilés, seul le dernier ouvert réagit.
 */
export function useDialogFocus<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const id = Symbol('dialog');
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    stack.push(id);

    const focusables = (): HTMLElement[] => {
      const list: HTMLElement[] = [];
      node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach((el) => {
        if (el.offsetParent !== null || el === document.activeElement) list.push(el);
      });
      return list;
    };
    const initial = node.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? node;
    initial.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (!stack.isTop(id)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      const target = wrapFocusTarget(items.length, items.indexOf(document.activeElement as HTMLElement), e.shiftKey);
      if (target === null) return;
      e.preventDefault();
      (target < 0 ? node : items[target]).focus();
    };
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      stack.remove(id);
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return ref;
}
