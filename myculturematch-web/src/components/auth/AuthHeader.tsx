import React from 'react';
import logoMyCultureMatch from '@/assets/logo-myculturematch.png';

interface AuthHeaderProps {
  mode: 'signin' | 'signup';
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ mode }) => {
  return (
    <>
      {/* Logo or Icon */}
      <div className="flex items-center gap-3 mb-8 select-none">
        <img src={logoMyCultureMatch} alt="MyCultureMatch Logo" className="w-10 h-10 object-contain rounded-xl" />
        <span className="font-extrabold text-xl dark:text-white">MyCultureMatch</span>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          {mode === 'signin' ? 'Heureux de vous revoir' : 'Rejoignez la communauté'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
          {mode === 'signin'
            ? 'Entrez vos identifiants pour accéder à vos compagnons et traditions.'
            : 'Commencez votre voyage d’exploration culturelle en créant votre compte.'}
        </p>
      </div>
    </>
  );
};
