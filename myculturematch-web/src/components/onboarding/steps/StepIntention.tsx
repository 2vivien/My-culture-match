import React from 'react';
import { Heart, Users, Globe, Compass, Check } from 'lucide-react';

interface StepIntentionProps {
  intention: string;
  updateField: (field: string, value: any) => void;
}

const OPTIONS = [
  { id: 'union', label: 'Je cherche une union sérieuse', desc: 'Mariage, engagement de vie, construction solide', icon: Heart },
  { id: 'culture', label: 'Retrouver des gens de ma culture', desc: 'Communauté, réseau social local, partage des racines', icon: Users },
  { id: 'discover', label: "Découvrir d'autres cultures", desc: 'Ouverture spirituelle, curiosité sincère et enrichissement', icon: Globe },
  { id: 'explore', label: 'Je ne sais pas encore', desc: 'Je verrai au fil des rencontres et des discussions', icon: Compass }
];

export const StepIntention: React.FC<StepIntentionProps> = ({ intention, updateField }) => {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
          Ton Intention
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">
          Pourquoi es-tu là aujourd'hui ?
        </h2>
        <p className="text-sm text-zinc-500 mt-2">
          Ta réponse oriente tout notre algorithme d'affinités culturelles dès le départ.
        </p>
      </div>
      <div className="grid gap-4">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => updateField('intention', opt.id)}
            type="button"
            className={`w-full p-5 text-left border-2 rounded-2xl flex items-center gap-4 transition-all cursor-pointer ${
              intention === opt.id
                ? 'border-primary bg-primary-light/30 dark:bg-primary/10'
                : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${intention === opt.id ? 'bg-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>
              <opt.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-zinc-900 dark:text-white text-base">{opt.label}</h4>
              <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
            </div>
            {intention === opt.id && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                <Check className="w-4 h-4" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
