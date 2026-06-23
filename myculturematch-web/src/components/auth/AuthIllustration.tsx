import React from 'react';
import { Globe } from 'lucide-react';
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
        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 w-fit">
          <Globe className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm font-semibold tracking-wide">Rencontres & Héritage Culturel</span>
        </div>
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            MyCulture<span className="text-primary font-bold">Match</span>
          </h1>
          <p className="text-lg text-zinc-200 mt-3 font-medium max-w-lg leading-relaxed">
            Reliez vos racines, partagez vos histoires ancestrales, et trouvez les compagnons qui font vibrer votre héritage.
          </p>
        </div>

        <div className="flex gap-8 border-t border-white/10 pt-6 mt-2">
          <div>
            <div className="text-2xl font-black text-primary">100%</div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Héritage authentique</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">15+</div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Critères culturels</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">Trio</div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Recommandations hebdos</div>
          </div>
        </div>
      </div>
    </div>
  );
};
