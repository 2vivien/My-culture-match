import React, { useMemo, useState } from 'react';
import { ToggleRow } from '../rows/ToggleRow';
import { SearchableSelect } from '@/src/components/ui/SearchableSelect';
import { useLanguages } from '@/src/services/geo.service';

export const PreferencesSection: React.FC = () => {
  const [autoplayVideos, setAutoplayVideos] = useState(true);
  const [displayLanguage, setDisplayLanguage] = useState('Français');
  const { data: libLanguages, isLoading } = useLanguages();

  const languageOptions = useMemo(
    () =>
      (libLanguages ?? [])
        .map((l) => ({ value: l.native, label: l.native, native: l.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [libLanguages]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
          App Experience
        </h2>
        <div className="divide-y divide-app-border/40 dark:divide-zinc-800/40">
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-extrabold text-app-black dark:text-zinc-400">Display Language</span>
            <div className="w-full sm:w-64">
              <SearchableSelect
                options={languageOptions}
                value={displayLanguage}
                onChange={(value) => setDisplayLanguage(value as string)}
                placeholder="Choisir une langue..."
                loading={isLoading}
                inputClassName="px-3 py-2 text-xs rounded-xl"
              />
            </div>
          </div>
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-extrabold text-app-black dark:text-zinc-400">Content Filter</span>
            <select className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]">
              <option>Standard (Recommended)</option>
              <option>Strict</option>
              <option>Off</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
          Media Autoplay
        </h2>
        <div className="divide-y divide-app-border/40 dark:divide-zinc-800/40">
          <ToggleRow
            title="Autoplay Videos"
            description="Automatically play videos when scrolling feed"
            isActive={autoplayVideos}
            onToggle={() => setAutoplayVideos(!autoplayVideos)}
          />
        </div>
      </div>
    </div>
  );
};
