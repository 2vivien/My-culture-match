import React from 'react';

export const AuthFooter: React.FC = () => {
  return (
    <div className="mt-8 text-center text-xs text-zinc-500">
      En continuant, vous acceptez les{' '}
      <a href="#" className="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
        Conditions d’Utilisation
      </a>{' '}
      et la{' '}
      <a href="#" className="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
        Politique de Confidentialité
      </a>{' '}
      de MyCultureMatch.
    </div>
  );
};
