import React from 'react';
import { Shield } from 'lucide-react';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import type { TribeModerator } from '@/src/types/tribu';

interface TribuModsProps {
  moderators: TribeModerator[];
}

export const TribuMods: React.FC<TribuModsProps> = ({ moderators }) => {
  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[20px] p-5 shadow-xs">
      <h3 className="font-extrabold text-sm text-app-black dark:text-zinc-200 mb-4 border-b border-app-border/40 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
        <Shield className="w-4.5 h-4.5 text-[#8B4A2B] dark:text-[#8B4A2B]" />
        Tribe Moderators
      </h3>
      <div className="flex flex-col gap-3.5">
        {moderators.length === 0 && (
          <p className="text-[11px] text-app-gray dark:text-zinc-500 py-2 select-none">Aucun modérateur.</p>
        )}
        {moderators.map((mod) => (
          <div key={mod.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ProfileAvatar src={mod.avatar} alt={mod.name} size="xs" glow="none" />
              <span className="font-extrabold text-app-black dark:text-zinc-200">
                {mod.name}
              </span>
            </div>
            <span className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase">
              {mod.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
