import React from 'react';
import { ConnectionUser } from '@/src/stores/useConnectionsStore';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { User, MessageCircle, MousePointerClick, Unplug } from 'lucide-react';

interface CompanionRowProps {
  user: ConnectionUser;
  onMessage: (id: string) => void;
  onProfile?: (id: string) => void;
}

export const CompanionRow: React.FC<CompanionRowProps> = ({ user, onMessage, onProfile }) => {
  return (
    <div className="bg-zinc-50/50 dark:bg-zinc-900/60 p-4.5 rounded-[22px] border border-app-border dark:border-zinc-800 flex items-center justify-between hover:shadow-md transition-shadow relative w-full">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative shrink-0 select-none">
          <TotemAvatar src={user.avatar} alt={user.name} size="md" glow="none" statusDot={user.online ? 'online' : 'offline'} />
          <div className="absolute -bottom-1 -right-1 bg-app-black dark:bg-zinc-800 text-white text-[8px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border border-white dark:border-zinc-900 uppercase shadow-sm">
            {user.countryCode}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-300 truncate leading-tight">{user.name}</h4>
          <div className="flex items-center gap-1.5 text-[10px] text-app-gray dark:text-zinc-400 font-bold mt-1.5">
            <span className="flex items-center gap-0.5"><MousePointerClick className="w-3.5 h-3.5 text-[#E27D60] shrink-0" /> {user.interestedCount} Interested</span>
            <span>•</span>
            <span className="flex items-center gap-0.5"><Unplug className="w-3.5 h-3.5 text-[#E27D60] shrink-0" /> {user.compagnonsCount} Compagnons</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2.5">
        <button onClick={() => onProfile && onProfile(user.id)} className="w-10 h-10 rounded-2xl border border-app-border dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-app-gray hover:text-app-black dark:hover:text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95">
          <User className="w-4 h-4 text-app-gray dark:text-zinc-400 stroke-[2.5]" />
        </button>
        <button onClick={() => onMessage(user.id)} className="w-10 h-10 rounded-2xl bg-[#E27D60] dark:bg-[#c66b50] text-white hover:opacity-95 flex items-center justify-center shadow-md shadow-primary/10 cursor-pointer transition-all hover:scale-105 active:scale-95">
          <MessageCircle className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
