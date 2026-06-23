import React from 'react';
import { Shield, Users, Smile, Check } from 'lucide-react';
import { CRITERIA } from '@/src/services/onboarding.service';
import { StepRecap } from './StepRecap';

interface StepsDetailsRecapProps {
  step: number;
  familyQuiz: string;
  situation: string;
  criteria: string[];
  bio: string;
  name: string;
  username: string;
  avatarSeed: string;
  roots: { country: string; region: string; ethnicity: string; village: string };
  updateField: (field: string, value: any) => void;
  toggleList: (field: 'values' | 'languages' | 'criteria', item: string, max?: number) => void;
}

export const StepsDetailsRecap: React.FC<StepsDetailsRecapProps> = ({
  step,
  familyQuiz,
  situation,
  criteria,
  bio,
  name,
  username,
  avatarSeed,
  roots,
  updateField,
  toggleList,
}) => {
  if (step === 11) {
    return (
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Famille</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Quel est votre rapport à la famille ?</h2>
          <p className="text-sm text-zinc-500 mt-2">Quelle importance accordez-vous à la validation ou aux coutumes familiales dans vos relations ?</p>
        </div>
        <div className="grid gap-4">
          {[
            { id: 'strict', label: 'Accord familial essentiel', desc: 'L’approbation de mes proches est une fondation indéboulonnable.', icon: Shield },
            { id: 'mixed', label: 'Avis important', desc: 'Je respecte leur regard mais je conserve toujours le dernier mot.', icon: Users },
            { id: 'independent', label: 'Indépendance totale', desc: 'Je prends mes décisions affectives en toute autonomie personnelle.', icon: Smile }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => updateField('familyQuiz', opt.id)}
              type="button"
              className={`w-full p-5 text-left border-2 rounded-2xl flex items-center gap-4 transition-all ${familyQuiz === opt.id ? 'border-primary bg-primary-light/30 dark:bg-primary/10' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${familyQuiz === opt.id ? 'bg-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}><opt.icon className="w-6 h-6" /></div>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-900 dark:text-white text-base">{opt.label}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
              </div>
              {familyQuiz === opt.id && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 12) {
    return (
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Situation</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Votre situation civile actuelle</h2>
          <p className="text-sm text-zinc-500 mt-2">Une transparence totale pour débuter des discussions en toute confiance.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {['Célibataire', 'Divorcé(e)', 'Veuf/Veuve', 'Secret'].map(sit => (
            <button
              key={sit}
              type="button"
              onClick={() => updateField('situation', sit)}
              className={`p-6 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all font-bold text-base ${situation === sit ? 'border-primary bg-primary-light/30 dark:bg-primary/10 text-primary' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300'}`}
            >
              <span>{sit}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 13) {
    return (
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Critères</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Qu'est-ce qui est vital pour vous ?</h2>
          <p className="text-sm text-zinc-500 mt-2">Choisissez jusqu'à 5 critères profonds indispensables pour vos futurs matchs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CRITERIA.map(crit => (
            <button
              key={crit}
              type="button"
              onClick={() => toggleList('criteria', crit, 5)}
              className={`px-5 py-3 border-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${criteria.includes(crit) ? 'border-primary bg-primary text-white' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
            >
              {criteria.includes(crit) && <Check className="w-4 h-4" />}
              <span>{crit}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 14) {
    return (
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Biographie</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Présentez-vous sincèrement</h2>
          <p className="text-sm text-zinc-500 mt-2">Pas besoin de rédiger un texte parfait. Écrivez juste une phrase ou deux sur votre histoire et ce que vous aimez. (Min. 10 caractères)</p>
        </div>
        <div className="space-y-2">
          <textarea
            value={bio}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder="Exemple: Sénégalais d’origine vivant à Lyon..."
            rows={6}
            maxLength={1000}
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-3xl outline-none text-zinc-900 dark:text-white text-base transition-colors placeholder:text-zinc-400 leading-relaxed resize-none"
          />
          <div className="flex justify-between items-center text-xs font-bold text-zinc-400 px-1">
            <span>Min. 10 caractères</span>
            <span>{bio.length} / 1000</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 15) {
    return (
      <StepRecap
        name={name}
        username={username}
        avatarSeed={avatarSeed}
        country={roots.country}
        region={roots.region}
        ethnicity={roots.ethnicity}
      />
    );
  }

  return null;
};
