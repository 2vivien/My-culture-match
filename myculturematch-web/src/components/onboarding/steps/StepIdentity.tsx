import React from 'react';

interface StepIdentityProps {
  name: string;
  username: string;
  usernameSuggestions: string[];
  setName: (name: string) => void;
  setUsername: (user: string) => void;
}

export const StepIdentity: React.FC<StepIdentityProps> = ({
  name,
  username,
  usernameSuggestions,
  setName,
  setUsername,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
          Identité
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
          Présentez-vous
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Votre prénom et votre pseudo aident votre communauté à vous reconnaître.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
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

        <div className="space-y-2">
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
          <div className="space-y-2 select-none">
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
