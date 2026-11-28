import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { AuthPage } from '@/src/pages/AuthPage';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Popup de connexion du home (mode visiteur).
 * - reste au-dessus du site, sans remplacer la page ;
 * - fermeture par croix, clic hors carte ou Échap ;
 * - focus placé dans le formulaire, verrouillé dans la popup, puis restauré ;
 * - scroll du body bloqué tant que la popup est ouverte.
 */
export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal } = useUIStore();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthModalOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Le champ email est monté juste après l'ouverture (AnimatePresence).
    const focusTimer = window.setTimeout(() => {
      // On place le curseur dans le champ email, pas sur la croix de fermeture.
      const email = dialogRef.current?.querySelector('#email') as HTMLElement | null;
      const first = email ?? (Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? []) as HTMLElement[])[0];
      first?.focus();
    }, 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAuthModal();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      // Focus trap : Tab/Shift+Tab restent dans la popup.
      const items = (Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)) as HTMLElement[]).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isAuthModalOpen, closeAuthModal]);

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAuthModal();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Connexion à MyCultureMatch"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="relative w-full max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto hide-scrollbar rounded-[28px] border border-app-border dark:border-zinc-800 bg-[#FEFEFE] dark:bg-zinc-950 shadow-2xl p-6 sm:p-8 text-app-black dark:text-zinc-100"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Fermer la connexion"
              title="Fermer"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <AuthPage variant="modal" onClose={closeAuthModal} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
