import React from 'react';
import { ConnectionUser } from '@/src/stores/useConnectionsStore';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { MessageSquare, MousePointerClick, Unplug } from 'lucide-react';

interface CompanionCardProps {
  user: ConnectionUser;
  onMessage: (id: string) => void;
}

export const CompanionCard: React.FC<CompanionCardProps> = ({ user, onMessage }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-app-border dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative w-full">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3 select-none">
          <TotemAvatar src={user.avatar} alt={user.name} size="lg" glow="none" statusDot={user.online ? 'online' : 'offline'} />
          <span className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 text-xs shadow-md rounded-full w-7 h-7 flex items-center justify-center border border-app-border dark:border-zinc-700">{user.countryFlag}</span>
        </div>
        <h4 className="font-extrabold text-base text-app-black dark:text-zinc-300 leading-tight">{user.name}</h4>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${user.online ? 'text-green-600 bg-green-50 dark:bg-green-950/20' : 'text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40'}`}>
          {user.online ? 'En ligne' : 'Offline'}
        </span>
        
        {/* Companion & Interests stats using MousePointerClick and Unplug icons */}
        <div className="flex flex-col items-center gap-1.5 text-[10px] text-app-gray dark:text-zinc-400 font-bold mt-4 mb-3.5 select-none">
          <div className="flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-[#E27D60] shrink-0" />
            <span>{user.interestedCount} Interested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Unplug className="w-3.5 h-3.5 text-[#E27D60] shrink-0" />
            <span>{user.compagnonsCount} Compagnons</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => onMessage(user.id)}
        className="w-full py-2.5 rounded-xl text-xs font-black bg-[#E27D60] hover:bg-[#c66b50] text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Message
      </button>
    </div>
  );
};
