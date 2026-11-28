import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useDialogFocus } from '@/src/hooks/useDialogFocus';

interface DialogProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'role' | 'onClose'> {
  /** Appelé par Échap (la fermeture par bouton reste à la charge du contenu). */
  onClose: () => void;
  /** Nom accessible, ou `labelledBy` (id d'un titre). */
  label?: string;
  labelledBy?: string;
}

/**
 * Dialogue modal partagé : role="dialog" + aria-modal, focus initial, piège de Tab, Échap et retour du focus
 * (useDialogFocus). S'utilise comme enfant direct d'`AnimatePresence` pour animer la sortie.
 */
export const Dialog = ({ onClose, label, labelledBy, children, ...rest }: DialogProps) => {
  const ref = useDialogFocus<HTMLDivElement>(onClose);
  return (
    <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={label} aria-labelledby={labelledBy} tabIndex={-1} {...rest}>
      {children}
    </motion.div>
  );
};
