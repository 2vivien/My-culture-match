import React, { useState } from 'react';
import { ToggleRow } from '../rows/ToggleRow';

export const PreferencesSection: React.FC = () => {
  const [autoplayVideos, setAutoplayVideos] = useState(true);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
          App Experience
        </h2>
        <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Display Language</span>
            <select className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]">
              <option>English (US)</option>
              <option>Français</option>
              <option>Español</option>
              <option>日本語</option>
            </select>
          </div>
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Content Filter</span>
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
        <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
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
