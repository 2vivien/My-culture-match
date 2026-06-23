import React, { useState } from 'react';
import { ToggleRow } from '../rows/ToggleRow';

export const PrivacySection: React.FC = () => {
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivity, setShowActivity] = useState(true);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
          Visibility
        </h2>
        <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
          <ToggleRow
            title="Private Account"
            description="Only approved companions can see your traditions and photos"
            isActive={isPrivate}
            onToggle={() => setIsPrivate(!isPrivate)}
          />
          <ToggleRow
            title="Activity Status"
            description="Show when you are active on MyCultureMatch"
            isActive={showActivity}
            onToggle={() => setShowActivity(!showActivity)}
          />
        </div>
      </div>
      <div>
        <h2 className="text-xs uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
          Interactions
        </h2>
        <div className="divide-y divide-app-border/40 dark:divide-zinc-850/40">
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-extrabold text-app-black dark:text-zinc-250">Who can message you</span>
            <select className="px-3 py-1.5 text-xs rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#E27D60]">
              <option>Everyone</option>
              <option>Companions Only</option>
              <option>No One</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
