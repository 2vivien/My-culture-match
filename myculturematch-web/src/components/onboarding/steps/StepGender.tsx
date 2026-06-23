import React from 'react';

interface StepGenderProps {
  gender: string;
  seeking: string;
  updateField: (field: string, value: any) => void;
}

export const StepGender: React.FC<StepGenderProps> = ({ gender, seeking, updateField }) => {
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
          Identité
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
          Ton profil de genre
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Ces informations nous aident à cibler les suggestions correspondantes.
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Je suis :</h3>
        <div className="grid grid-cols-3 gap-4">
          {['Homme', 'Femme', 'Autre'].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => updateField('gender', g)}
              className={`py-5 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all font-bold cursor-pointer ${
                gender === g
                  ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary'
                  : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span className="text-lg">{g}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Je cherche :</h3>
        <div className="grid grid-cols-3 gap-4">
          {['Hommes', 'Femmes', 'Les deux'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => updateField('seeking', s)}
              className={`py-5 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all font-bold cursor-pointer ${
                seeking === s
                  ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary'
                  : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span className="text-lg">{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
