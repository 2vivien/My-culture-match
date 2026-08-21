import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import type { UpdateField } from '@/src/lib/onboarding.schemas';

interface StepBirthdateProps {
  birthdate: string;
  age: number;
  updateField: UpdateField;
}

export const StepBirthdate: React.FC<StepBirthdateProps> = ({
  birthdate,
  age,
  updateField,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
          Date de Naissance
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
          Quelle est votre date de naissance ?
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Vous devez avoir au moins 18 ans pour utiliser MyCultureMatch. Votre âge est calculé automatiquement.
        </p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Date de naissance
          </label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => updateField('birthdate', e.target.value)}
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors cursor-pointer"
            required
          />
        </div>

        {birthdate && (
          <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl">
            <span className="text-zinc-400 font-bold block text-xs uppercase tracking-wider">Votre âge calculé</span>
            <span className="text-4xl font-black text-primary mt-1 block">{age} ans</span>
            {age < 18 ? (
              <div className="flex items-center justify-center gap-1.5 text-red-500 font-bold text-xs mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Vous devez avoir au moins 18 ans.</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-xs mt-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Âge requis validé</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
