import React, { useState } from 'react';
import { ToggleRow } from '../rows/ToggleRow';

export const EmailSection: React.FC = () => {
  const [weeklyHighlights, setWeeklyHighlights] = useState(true);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
          Email Preferences
        </h2>
        <div className="divide-y divide-app-border/40 dark:divide-zinc-800/40">
          <ToggleRow
            title="Weekly Highlights"
            description="Top traditions and news from the community"
            isActive={weeklyHighlights}
            onToggle={() => setWeeklyHighlights(!weeklyHighlights)}
          />
          <ToggleRow
            title="Security & Account Alerts"
            description="Important notifications about your account status"
            isActive={true}
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
};
