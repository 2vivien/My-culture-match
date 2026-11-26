import React, { useState } from 'react';
import { ConnectionUser } from '@/src/stores/useConnectionsStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { Heart, Users, Check, MousePointerClick, Unplug } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface UserRowProps {
  user: ConnectionUser;
  onConnect: (id: string) => void;
  isInterested?: boolean;
}

export const UserRow: React.FC<UserRowProps> = ({ user, onConnect, isInterested }) => {
  const [requested, setRequested] = useState(user.isConnected || false);

  const handleConnect = () => {
    setRequested(true);
    onConnect(user.id);
  };

  return (
    <div className="bg-zinc-50/50 dark:bg-zinc-900/60 p-4.5 rounded-[22px] border border-app-border dark:border-zinc-800 flex items-center justify-between hover:shadow-md transition-shadow relative w-full">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative shrink-0 select-none">
          <ProfileAvatar src={user.avatar} alt={user.name} size="md" glow="turquoise" />
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 text-app-black dark:text-white text-[8px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border border-white dark:border-zinc-900 uppercase shadow-sm">
            {user.countryCode}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-300 truncate leading-tight">{user.name}</h4>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-app-gray dark:text-zinc-400 font-bold mt-1.5">
            <span className="flex items-center gap-0.5"><MousePointerClick className="w-3.5 h-3.5 text-[#E27D60] shrink-0" /> {user.interestedCount} Interested</span>
            <span>•</span>
            <span className="flex items-center gap-0.5"><Unplug className="w-3.5 h-3.5 text-[#E27D60] shrink-0" /> {user.compagnonsCount} Compagnons</span>
          </div>
          <p className="text-[11px] text-app-gray dark:text-zinc-405 font-medium mt-1 truncate">
            {isInterested 
              ? "Cette personne vous porte de l'intérêt" 
              : (user.interests && user.interests.length > 0 ? user.interests.join(' • ') : 'Interested in your profile')}
          </p>
        </div>
      </div>
      <button onClick={handleConnect} disabled={requested} className={cn("w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 ml-2.5", requested ? "bg-zinc-100 dark:bg-zinc-800 text-app-gray shadow-none" : "bg-[#E27D60] text-white hover:bg-[#c66b50] shadow-orange-500/10")}>
        {requested ? <Check className="w-4 h-4 text-green-600 stroke-[3.5]" /> : <Unplug className="w-4 h-4 text-white stroke-[2.5]" />}
      </button>
    </div>
  );
};
