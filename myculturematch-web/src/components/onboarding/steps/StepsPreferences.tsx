import React from 'react';
import { Check, Shield, Globe, Sparkles, Smile, Compass } from 'lucide-react';
import { VALUES, LANGUAGES } from '@/src/services/onboarding.service';

interface StepsPreferencesProps {
  step: number;
  values: string[];
  languages: string[];
  preference: string;
  diaspora: string;
  updateField: (field: string, value: any) => void;
  toggleList: (field: 'values' | 'languages' | 'criteria', item: string, max?: number) => void;
}

export const StepsPreferences: React.FC<StepsPreferencesProps> = ({
  step,
  values,
  languages,
  preference,
  diaspora,
  updateField,
  toggleList,
}) => {
  if (step === 7) {
    return (
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Valeurs</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Quelles sont vos valeurs fondamentales ?</h2>
          <p className="text-sm text-zinc-500 mt-2">Sélectionnez jusqu'à 4 valeurs essentielles qui guident vos relations et vos choix de vie.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {VALUES.map(val => (
            <button
              key={val.id}
              type="button"
              onClick={() => toggleList('values', val.label, 4)}
              className={`p-4 border-2 rounded-2xl flex items-center gap-3 transition-all text-left font-semibold ${values.includes(val.label) ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${values.includes(val.label) ? 'border-primary bg-primary text-white' : 'border-zinc-300 dark:border-zinc-750'}`}>{values.includes(val.label) && <Check className="w-3.5 h-3.5" />}</div>
              <span className="text-sm sm:text-base">{val.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 8) {
    return (
      <div className="space-y-8">
        <div className="text-center md:text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Langues</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Quelles langues parlez-vous ?</h2>
          <p className="text-sm text-zinc-500 mt-2">Sélectionnez toutes les langues que vous maîtrisez pour communiquer avec vos futurs compagnons.</p>
        </div>
        {Object.entries(LANGUAGES).map(([key, list]) => (
          <div key={key} className="space-y-3">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">{key === 'intl' ? 'International' : key === 'africa' ? 'Afrique' : 'Diaspora'}</h3>
            <div className="flex flex-wrap gap-2">
              {list.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleList('languages', lang)}
                  className={`px-4 py-2 border rounded-full text-sm font-bold transition-all ${languages.includes(lang) ? 'border-primary bg-primary text-white' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (step === 9) {
    return (
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Match Idéal</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Quel est votre match idéal ?</h2>
          <p className="text-sm text-zinc-500 mt-2">Dites-nous si vous accordez une importance stricte ou ouverte à la proximité d'origine.</p>
        </div>
        <div className="grid gap-4">
          {[
            { id: 'same', label: 'Ma propre culture', desc: 'Rencontrer en priorité des personnes de la même ethnie, région ou langue.', icon: Shield },
            { id: 'region', label: 'Même continent', desc: 'Avoir les mêmes affinités élargies (Ex: Afrique de l’Ouest, Maghreb, etc.)', icon: Globe },
            { id: 'target', label: 'Une culture précise', desc: 'J’ai une affinité ou un intérêt spécifique pour une culture donnée.', icon: Sparkles },
            { id: 'open', label: 'Ouverture totale', desc: 'Les valeurs de cœur et d’esprit comptent bien plus pour moi que l’origine.', icon: Smile }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => updateField('preference', opt.id)}
              type="button"
              className={`w-full p-5 text-left border-2 rounded-2xl flex items-center gap-4 transition-all ${preference === opt.id ? 'border-primary bg-primary-light/30 dark:bg-primary/10' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${preference === opt.id ? 'bg-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}><opt.icon className="w-6 h-6" /></div>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-900 dark:text-white text-base">{opt.label}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
              </div>
              {preference === opt.id && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 10) {
    return (
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Diaspora</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Profils à l'étranger ?</h2>
          <p className="text-sm text-zinc-500 mt-2">Êtes-vous ouvert(e) à faire connaissance avec des personnes de votre culture vivant dans d'autres pays ?</p>
        </div>
        <div className="grid gap-4">
          {[
            { id: 'yes', label: 'Oui, sans aucun problème', desc: 'Les racines communes importent plus que la géographie physique.', icon: Globe },
            { id: 'maybe', label: 'Selon le pays', desc: 'Je préfère préserver une certaine proximité géographique raisonnable.', icon: Compass },
            { id: 'no', label: 'Priorité pays d’origine', desc: 'Je préfère rencontrer des personnes qui vivent au cœur de ma patrie.', icon: Shield }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => updateField('diaspora', opt.id)}
              type="button"
              className={`w-full p-5 text-left border-2 rounded-2xl flex items-center gap-4 transition-all ${diaspora === opt.id ? 'border-primary bg-primary-light/30 dark:bg-primary/10' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${diaspora === opt.id ? 'bg-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}><opt.icon className="w-6 h-6" /></div>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-900 dark:text-white text-base">{opt.label}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
              </div>
              {diaspora === opt.id && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
