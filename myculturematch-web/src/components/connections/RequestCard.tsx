import React from 'react';
import { ConnectionUser } from '@/src/stores/useConnectionsStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { MousePointerClick, Unplug, X, Check } from 'lucide-react';

interface RequestCardProps {
  user: ConnectionUser;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ user, onAccept, onDecline }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-app-border dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative w-full">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3 select-none">
          <ProfileAvatar src={user.avatar} alt={user.name} size="lg" glow="orange" />
          <span className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 text-xs shadow-md rounded-full w-7 h-7 flex items-center justify-center border border-app-border dark:border-zinc-700">{user.countryFlag}</span>
        </div>
        <h4 className="font-extrabold text-base text-app-black dark:text-zinc-100 flex items-center gap-1.5 justify-center leading-tight">
          {user.name}
        </h4>
        <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider mt-1">{user.mode === 'love' ? 'Demande Love' : 'souhaite se connecter'}</p>
        
        {/* Companion & Interests stats using MousePointerClick and Unplug icons */}
        <div className="flex flex-col items-center gap-1.5 text-[10px] text-app-gray dark:text-zinc-400 font-bold mt-4 mb-3.5 select-none">
          <div className="flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-[#8B4A2B] shrink-0" />
            <span>{user.interestedCount} Interested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Unplug className="w-3.5 h-3.5 text-[#8B4A2B] shrink-0" />
            <span>{user.compagnonsCount} Compagnons</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 text-xs font-black">
        <button onClick={() => onDecline(user.id)} className="flex-1 py-2.5 rounded-xl border border-app-border dark:border-zinc-800 text-app-gray hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
          <X className="w-4 h-4 text-app-gray" />
          Refuse
        </button>
        <button onClick={() => onAccept(user.id)} className="flex-1 py-2.5 bg-[#8B4A2B] text-white hover:opacity-90 cursor-pointer rounded-xl flex items-center justify-center gap-1.5 transition-all">
          <Check className="w-4 h-4 text-white" />
          Accept
        </button>
      </div>
    </div>
  );
};
