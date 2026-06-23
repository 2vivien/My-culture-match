import React from 'react';
import { RefreshCw } from 'lucide-react';

interface StepAvatarProps {
  name: string;
  username: string;
  avatarSeed: string;
  usernameSuggestions: string[];
  setName: (name: string) => void;
  setUsername: (user: string) => void;
  shuffleAvatar: () => void;
}

export const StepAvatar: React.FC<StepAvatarProps> = ({
  name,
  username,
  avatarSeed,
  usernameSuggestions,
  setName,
  setUsername,
  shuffleAvatar,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
          Nom & Avatar
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
          Présentez-vous
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Un avatar unique est généré en temps réel à partir de votre prénom ou de votre nom d'utilisateur.
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-6">
        <div className="relative group animate-bounce-subtle">
          <div className="w-36 h-36 rounded-3xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-4 border-primary/20 dark:border-primary/40 shadow-xl flex items-center justify-center">
            <img
              src={`https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(avatarSeed || 'default')}`}
              alt="Dicebear OpenPeeps Avatar"
              className="w-full h-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={shuffleAvatar}
            className="absolute -bottom-2 right-2 p-3 bg-primary text-white rounded-2xl shadow-lg hover:bg-opacity-95 transition-all flex items-center justify-center cursor-pointer border-2 border-white dark:border-zinc-950"
            title="Générer un autre avatar"
          >
            <RefreshCw className="w-5 h-5 animate-spin-hover" />
          </button>
        </div>

        <div className="w-full space-y-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Votre Nom & Prénom
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Amal Bénin, Malik Diop..."
            className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
            required
          />
        </div>

        <div className="w-full space-y-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Nom d'utilisateur (Username)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 font-bold">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              placeholder="nomutilisateur"
              className="w-full pl-8 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
              required
            />
          </div>
        </div>

        {usernameSuggestions.length > 0 && (
          <div className="w-full space-y-2 select-none">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Suggestions de nom d'utilisateur :</span>
            <div className="flex flex-wrap gap-2">
              {usernameSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setUsername(sug)}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-bold hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  @{sug}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
