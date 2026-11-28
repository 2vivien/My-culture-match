import React from 'react';
import { ConnectionUser } from '@/src/stores/useConnectionsStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { X, Check } from 'lucide-react';

interface RequestRowProps {
  user: ConnectionUser;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const RequestRow: React.FC<RequestRowProps> = ({ user, onAccept, onDecline }) => {
  return (
    <div className="bg-zinc-50/50 dark:bg-zinc-900/60 p-4.5 rounded-[22px] border border-app-border dark:border-zinc-800 flex items-center justify-between hover:shadow-md transition-shadow relative w-full">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative shrink-0 select-none">
          <ProfileAvatar src={user.avatar} alt={user.name} size="md" glow="orange" />
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-800 text-app-black dark:text-white text-[8px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border border-white dark:border-zinc-900 uppercase shadow-sm">
            {user.countryCode}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-300 truncate leading-tight">{user.name}</h4>
          </div>
          <p className="text-[11px] text-app-gray dark:text-zinc-400 font-semibold mt-1.5 truncate">
            {user.mode === 'love' ? `Demande Love${user.country ? ` • ${user.country}` : ''}` : user.interests && user.interests.length > 0 ? user.interests.join(', ') : `${user.country} • Demande`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2.5">
        <button onClick={() => onDecline(user.id)} className="w-10 h-10 rounded-2xl border border-app-border dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-app-gray hover:text-app-black dark:hover:text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95">
          <X className="w-4 h-4 text-app-gray dark:text-zinc-400 stroke-[2.5]" />
        </button>
        <button onClick={() => onAccept(user.id)} className="w-10 h-10 rounded-2xl bg-[#8B4A2B] text-white hover:bg-[#6F3A22] flex items-center justify-center shadow-md shadow-orange-500/10 cursor-pointer transition-all hover:scale-105 active:scale-95">
          <Check className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
