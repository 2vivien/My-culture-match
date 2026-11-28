import React, { useState } from 'react';
import {
  Briefcase,
  Heart,
  Sparkles,
  Globe,
  Users,
  CircleUserRound,
  Target,
  FileText,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { isProfileDetailFilled, type ProfileDetails } from '@/src/lib/onboarding.schemas';
import { DOMAINS, VALUES, CRITERIA } from '@/src/services/onboarding.service';
import { cn } from '@/src/lib/utils';

const PREFERENCE_OPTIONS = [
  { id: 'same', label: 'Ma propre culture' },
  { id: 'region', label: 'Même continent' },
  { id: 'target', label: 'Une culture précise' },
  { id: 'open', label: 'Ouverture totale' },
];

const DIASPORA_OPTIONS = [
  { id: 'yes', label: 'Oui, sans aucun problème' },
  { id: 'maybe', label: 'Selon le pays' },
  { id: 'no', label: "Priorité pays d'origine" },
];

const FAMILY_OPTIONS = [
  { id: 'strict', label: 'Accord familial essentiel' },
  { id: 'mixed', label: 'Avis important' },
  { id: 'independent', label: 'Indépendance totale' },
];

const SITUATION_OPTIONS = [
  { id: 'celibataire', label: 'Célibataire' },
  { id: 'divorce', label: 'Divorcé(e)' },
  { id: 'veuf', label: 'Veuf/Veuve' },
  { id: 'secret', label: 'Secret' },
];

type SectionId = keyof ProfileDetails;

export const ProfileCompletionPanel: React.FC = () => {
  const { profileDetails, updateProfileDetail } = useAppStore();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);

  const details = profileDetails;
  const filledCount = (Object.keys(details) as SectionId[]).filter((id) =>
    isProfileDetailFilled(id, details[id])
  ).length;
  const totalCount = 8;
  const pct = Math.round((filledCount / totalCount) * 100);

  if (pct === 100) return null;

  const toggleItem = (field: 'values' | 'criteria', item: string, max?: number) => {
    const list = details[field];
    if (list.includes(item)) {
      updateProfileDetail(field, list.filter((i) => i !== item));
    } else if (!max || list.length < max) {
      updateProfileDetail(field, [...list, item]);
    }
  };

  const sections: { id: SectionId; title: string; desc: string; icon: React.ElementType }[] = [
    { id: 'occupation', title: 'Votre activité', desc: 'Domaine professionnel', icon: Briefcase },
    { id: 'values', title: 'Vos valeurs', desc: 'Ce qui guide vos relations', icon: Heart },
    { id: 'preference', title: 'Match idéal', desc: 'Proximité d’origine souhaitée', icon: Sparkles },
    { id: 'diaspora', title: 'Profils à l’étranger', desc: 'Votre ouverture géographique', icon: Globe },
    { id: 'familyQuiz', title: 'Rapport à la famille', desc: 'Place des proches dans vos choix', icon: Users },
    { id: 'situation', title: 'Situation civile', desc: 'Votre statut actuel', icon: CircleUserRound },
    { id: 'criteria', title: 'Critères essentiels', desc: 'Vos indispensables (5 max)', icon: Target },
    { id: 'bio', title: 'Biographie', desc: 'Une ou deux phrases (10 car. min)', icon: FileText },
  ];

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-black text-zinc-900 dark:text-white text-lg">Complétez votre profil</h3>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">
              Vos réponses affinent vos matchs culturels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-zinc-700 dark:text-zinc-200">{pct}%</span>
            <div className="h-2 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-800 dark:bg-zinc-300 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          {sections.map(({ id, title, desc, icon: Icon }) => {
            const filled = isProfileDetailFilled(id, details[id]);
            const open = openSection === id;
            return (
              <div
                key={id}
                className={cn(
                  'rounded-2xl border transition-colors',
                  open ? 'border-primary/40 bg-primary-light/20 dark:bg-primary/5' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenSection(open ? null : id)}
                  className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', filled ? 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400')}>
                    {filled ? <Check className="w-4.5 h-4.5" /> : <Icon className="w-4.5 h-4.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{title}</h4>
                    <p className="text-[11px] text-zinc-400 font-semibold truncate">{desc}</p>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform shrink-0', open && 'rotate-180')} />
                </button>

                {open && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                    <SectionEditor
                      id={id}
                      details={details}
                      updateProfileDetail={updateProfileDetail}
                      toggleItem={toggleItem}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function SectionEditor({
  id,
  details,
  updateProfileDetail,
  toggleItem,
}: {
  id: SectionId;
  details: ProfileDetails;
  updateProfileDetail: <K extends keyof ProfileDetails>(field: K, value: ProfileDetails[K]) => void;
  toggleItem: (field: 'values' | 'criteria', item: string, max?: number) => void;
}) {
  const chipClass = (selected: boolean) =>
    cn(
      'px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer',
      selected
        ? 'border-primary bg-primary text-white'
        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300'
    );

  const optionClass = (selected: boolean) =>
    cn(
      'px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer text-left',
      selected
        ? 'border-primary bg-primary-light/40 dark:bg-primary/10 text-primary'
        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300'
    );

  if (id === 'occupation') {
    const occupation = details.occupation;
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((dom) => (
            <button
              key={dom.id}
              type="button"
              onClick={() => updateProfileDetail('occupation', { ...occupation, domain: dom.label })}
              className={chipClass(occupation.domain === dom.label)}
            >
              {dom.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={occupation.title}
          onChange={(e) => updateProfileDetail('occupation', { ...occupation, title: e.target.value })}
          placeholder="Intitulé de poste / Métier (Optionnel)"
          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
        />
      </div>
    );
  }

  if (id === 'values') {
    return (
      <div className="flex flex-wrap gap-2">
        {VALUES.map((val) => (
          <button
            key={val.id}
            type="button"
            onClick={() => toggleItem('values', val.label, 4)}
            className={chipClass(details.values.includes(val.label))}
          >
            {val.label}
          </button>
        ))}
      </div>
    );
  }

  if (id === 'preference') {
    return (
      <div className="grid gap-2">
        {PREFERENCE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => updateProfileDetail('preference', opt.id)}
            className={optionClass(details.preference === opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (id === 'diaspora') {
    return (
      <div className="grid gap-2">
        {DIASPORA_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => updateProfileDetail('diaspora', opt.id)}
            className={optionClass(details.diaspora === opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (id === 'familyQuiz') {
    return (
      <div className="grid gap-2">
        {FAMILY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => updateProfileDetail('familyQuiz', opt.id)}
            className={optionClass(details.familyQuiz === opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (id === 'situation') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {SITUATION_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => updateProfileDetail('situation', opt.id)}
            className={optionClass(details.situation === opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (id === 'criteria') {
    return (
      <div className="flex flex-wrap gap-2">
        {CRITERIA.map((crit) => (
          <button
            key={crit}
            type="button"
            onClick={() => toggleItem('criteria', crit, 5)}
            className={chipClass(details.criteria.includes(crit))}
          >
            {crit}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={details.bio}
        onChange={(e) => updateProfileDetail('bio', e.target.value)}
        placeholder="Ex: Sénégalais d'origine vivant à Lyon..."
        rows={4}
        maxLength={1000}
        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 resize-none"
      />
      <p className="text-[11px] text-zinc-400 font-semibold text-right">{details.bio.length} / 1000</p>
    </div>
  );
}
