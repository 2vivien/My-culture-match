import React from 'react';
import { DOMAINS } from '@/src/services/onboarding.service';

interface StepOccupationProps {
  occupation: { domain: string; title: string };
  updateField: (field: string, value: any) => void;
}

export const StepOccupation: React.FC<StepOccupationProps> = ({
  occupation,
  updateField,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
          Carrière
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
          Que faites-vous dans la vie ?
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Votre domaine d'activité permet de situer vos centres d'intérêts et votre quotidien.
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Domaine principal :</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOMAINS.map(dom => (
            <button
              key={dom.id}
              type="button"
              onClick={() => updateField('occupation', { ...occupation, domain: dom.label })}
              className={`p-4 text-left border-2 rounded-2xl flex items-center justify-between font-bold text-base transition-all cursor-pointer ${
                occupation.domain === dom.label
                  ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary'
                  : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300'
              }`}
            >
              <span>{dom.label}</span>
              {occupation.domain === dom.label && (
                <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">✓</span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-4">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Intitulé de poste / Métier (Optionnel)
          </label>
          <input
            type="text"
            value={occupation.title}
            onChange={(e) => updateField('occupation', { ...occupation, title: e.target.value })}
            placeholder="Ex: Designer UX, Ingénieur logiciel, Banquier, Médecin, Étudiant..."
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
