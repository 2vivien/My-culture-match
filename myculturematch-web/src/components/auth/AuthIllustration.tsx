import React from 'react';
import loginIllustration from '@/assets/login.png';

/**
 * Panneau visuel de la page de connexion : collage de portraits, sans texte
 * superposé (le titre et le sous-titre restent dans le formulaire à droite).
 */
export const AuthIllustration: React.FC = () => {
  return (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full relative overflow-hidden bg-[#FAF8F4]">
      <img
        src={loginIllustration}
        alt="Portraits de personnes de la communauté MyCultureMatch"
        className="w-full h-full object-cover object-center select-none"
      />
    </div>
  );
};
