import React from 'react';

interface StepRecapProps {
  name: string;
  username: string;
  avatarSeed: string;
  country: string;
  region: string;
  ethnicity: string;
}

export const StepRecap: React.FC<StepRecapProps> = ({
  name,
  username,
  avatarSeed,
  country,
  region,
  ethnicity,
}) => {
  return (
    <div className="space-y-8 py-4">
      <div className="text-center">
        <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-xs font-bold uppercase rounded-full tracking-wider">
          Profil Prêt
        </span>
        <h2 className="text-3xl font-black mt-4 text-zinc-900 dark:text-white">
          Votre profil est prêt !
        </h2>
      </div>

      {/* Simple Dynamic Avatar Display */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-3xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-4 border-primary/20 shadow-lg flex items-center justify-center">
          <img
            src={`https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(avatarSeed || username || name || 'default')}`}
            alt="Dicebear Profile"
            className="w-full h-full object-contain"
          />
        </div>
        <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">{name}</h3>
        {username && (
          <p className="text-sm font-bold text-primary">@{username}</p>
        )}
        {country && (
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider text-center">
            {country} | {region} {ethnicity ? `(${ethnicity})` : ''}
          </p>
        )}
      </div>

      {/* Welcoming Message */}
      <div className="space-y-4 text-center max-w-sm mx-auto">
        <p className="text-zinc-650 dark:text-zinc-300 font-semibold text-sm sm:text-base leading-relaxed">
          Vous pouvez modifier toutes vos informations et paramètres à tout moment depuis votre profil.
        </p>
        <div className="p-5 bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-2xl shadow-sm">
          <p className="text-zinc-900 dark:text-zinc-100 font-extrabold text-sm sm:text-base leading-relaxed">
            Rejoignez dès maintenant nos tribus, trouvez des compagnons culturels et découvrez l'amour !
          </p>
        </div>
      </div>
    </div>
  );
};
