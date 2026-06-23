import React, { useState } from 'react';
import { ConnectionUser } from '@/src/stores/useConnectionsStore';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { MousePointerClick, Unplug, Check, Heart, Users } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface UserCardProps {
  user: ConnectionUser;
  onConnect: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onConnect }) => {
  const [requested, setRequested] = useState(user.isConnected || false);

  const handleConnect = () => {
    setRequested(true);
    setTimeout(() => onConnect(user.id), 800);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-app-border dark:border-zinc-850 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative w-full">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3 select-none">
          <TotemAvatar src={user.avatar} alt={user.name} size="lg" glow="turquoise" />
          <span className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 text-xs shadow-md rounded-full w-7 h-7 flex items-center justify-center border border-app-border dark:border-zinc-700">{user.countryFlag}</span>
        </div>
        <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-150 flex items-center gap-1.5 justify-center leading-tight">
          {user.name}
        </h4>
        
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
        onClick={handleConnect}
        disabled={requested}
        className={cn(
          "w-full py-2.5 rounded-xl text-xs font-black cursor-pointer tracking-wider flex items-center justify-center gap-1.5 transition-all",
          requested ? 'bg-zinc-100 dark:bg-zinc-800 text-app-gray' : 'bg-[#E27D60] text-white hover:opacity-90'
        )}
      >
        {requested ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-600 stroke-[3.5]" />
            Requested
          </>
        ) : (
          <>
            <Unplug className="w-3.5 h-3.5 text-white" />
            Connect
          </>
        )}
      </button>
    </div>
  );
};
