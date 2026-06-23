import React from 'react';

interface StepRootsProps {
  country: string;
  region: string;
  ethnicity: string;
  village: string;
  updateRoots: (roots: { country: string; region: string; ethnicity: string; village: string }) => void;
}

export const StepRoots: React.FC<StepRootsProps> = ({
  country,
  region,
  ethnicity,
  village,
  updateRoots,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
          Héritage
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
          D'où venez-vous ?
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Précisez vos origines. Plus c'est exact, plus les matchs culturels seront fins.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Pays d'origine
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => updateRoots({ country: e.target.value, region, ethnicity, village })}
            placeholder="Ex: Sénégal, Bénin, Côte d'Ivoire..."
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Région d'origine
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => updateRoots({ country, region: e.target.value, ethnicity, village })}
            placeholder="Ex: Casamance, Littoral, Région des Lagunes..."
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-505 dark:text-zinc-400 uppercase tracking-wider block">
            Ethnie d'origine
          </label>
          <input
            type="text"
            value={ethnicity}
            onChange={(e) => updateRoots({ country, region, ethnicity: e.target.value, village })}
            placeholder="Ex: Fon, Yoruba, Wolof, Diola, Baoulé..."
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Ville ou Village natal (Optionnel)
          </label>
          <input
            type="text"
            value={village}
            onChange={(e) => updateRoots({ country, region, ethnicity, village: e.target.value })}
            placeholder="Ex: Ouidah, Saint-Louis, Yamoussoukro..."
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
