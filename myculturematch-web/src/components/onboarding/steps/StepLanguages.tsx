import React, { useMemo } from 'react';
import { SearchableSelect } from '@/src/components/ui/SearchableSelect';
import { useLanguages } from '@/src/services/geo.service';

interface StepLanguagesProps {
  languages: string[];
  toggleList: (field: 'values' | 'languages' | 'criteria', item: string, max?: number) => void;
}

const EXTRA_LANGUAGES = [
  { value: 'Soninké', label: 'Soninké' },
  { value: 'Moore', label: 'Moore' },
  { value: 'Bamiléké', label: 'Bamiléké' },
  { value: 'Créole haïtien', label: 'Créole haïtien' },
  { value: 'Créole antillais', label: 'Créole antillais' },
];

const POPULAR = [
  'Français',
  'Anglais',
  'Arabe',
  'Espagnol',
  'Portugais',
  'Wolof',
  'Yoruba',
  'Igbo',
  'Haoussa',
  'Swahili',
  'Lingala',
  'Bambara',
];

export const StepLanguages: React.FC<StepLanguagesProps> = ({ languages, toggleList }) => {
  const { data: libLanguages, isLoading } = useLanguages();

  const allOptions = useMemo(() => {
    const fromLib = (libLanguages ?? []).map((l) => ({
      value: l.native,
      label: l.native,
      native: l.name,
    }));
    const known = new Set([...fromLib.map((o) => o.value), ...EXTRA_LANGUAGES.map((o) => o.value)]);
    return [...fromLib, ...EXTRA_LANGUAGES.filter((o) => !known.has(o.value))].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [libLanguages]);

  const popular = POPULAR.filter((p) => allOptions.some((o) => o.value === p));

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">Langues</span>
        <h2 className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-white">Quelles langues parlez-vous ?</h2>
        <p className="text-sm text-zinc-500 mt-2">Recherchez et sélectionnez toutes les langues que vous maîtrisez pour communiquer avec vos futurs compagnons.</p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
          Vos langues
        </label>
        <SearchableSelect
          options={allOptions}
          value={languages}
          onChange={(value) => {
            const list = value as string[];
            const added = list.find((l) => !languages.includes(l));
            const removed = languages.find((l) => !list.includes(l));
            if (added) toggleList('languages', added);
            if (removed) toggleList('languages', removed);
          }}
          placeholder="Recherchez une langue..."
          multiple
          loading={isLoading}
          inputClassName="p-5"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Langues populaires</h3>
        <div className="flex flex-wrap gap-2">
          {popular.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleList('languages', lang)}
              className={`px-4 py-2 border rounded-full text-sm font-bold transition-all cursor-pointer ${languages.includes(lang) ? 'border-primary bg-primary text-white' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
