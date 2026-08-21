import React from 'react';
import authIllustration from '@/assets/auth_illustration.jpg';

export const AuthIllustration: React.FC = () => {
  return (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full relative overflow-hidden bg-zinc-900">
      <img
        src={authIllustration}
        alt="MyCultureMatch Illustration"
        className="absolute inset-0 w-full h-full object-cover opacity-85 select-none"
      />
      
      {/* Warm Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/25 to-transparent mix-blend-color-burn" />

      {/* Branding Info */}
      <div className="absolute bottom-16 left-16 right-16 text-white z-10 flex flex-col gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            MyCulture<span className="text-primary font-bold">Match</span>
          </h1>
          <p className="text-lg text-zinc-200 mt-3 font-medium max-w-lg leading-relaxed">
            Reliez vos racines, partagez vos histoires ancestrales, et trouvez les compagnons qui font vibrer votre héritage.
          </p>
        </div>
      </div>
    </div>
  );
};
