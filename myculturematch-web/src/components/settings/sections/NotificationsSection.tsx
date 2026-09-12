import React, { useState } from 'react';
import { ToggleRow } from '../rows/ToggleRow';

export const NotificationsSection: React.FC = () => {
  const [newMatches, setNewMatches] = useState(true);
  const [messages, setMessages] = useState(true);
  const [tribuActivity, setTribuActivity] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
          Push Notifications
        </h2>
        <div className="divide-y divide-app-border/40 dark:divide-zinc-800/40">
          <ToggleRow
            title="New Matches & Companions"
            description="When someone requests to connect with you"
            isActive={newMatches}
            onToggle={() => setNewMatches(!newMatches)}
          />
          <ToggleRow
            title="Messages"
            description="When you receive direct messages"
            isActive={messages}
            onToggle={() => setMessages(!messages)}
          />
          <ToggleRow
            title="Tribu Activity"
            description="Updates from Tribes you have joined"
            isActive={tribuActivity}
            onToggle={() => setTribuActivity(!tribuActivity)}
          />
        </div>
      </div>
    </div>
  );
};
