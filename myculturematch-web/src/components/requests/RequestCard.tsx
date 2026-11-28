import { useState, useRef, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import { useRequests } from '@/src/hooks/useRequests';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { Button } from '@/src/components/ui/button';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { NotificationDropdown } from '../layout/parts/NotificationDropdown';
import { AnimatePresence } from 'framer-motion';

export const RequestCard = () => {
  const { requests, respondToRequest } = useRequests();
  const unreadCount = useUIStore((s) => s.notificationsCount);
  const { setSelectedProfileUserId } = useAppStore();
  const { setActiveTab } = useUIStore();
  
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  if (requests.length === 0) return null;

  const current = requests[0];

  const handleClick = () => {
    setSelectedProfileUserId(current.id);
    setActiveTab('Profil');
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-float border border-app-border dark:border-zinc-800 relative select-none" ref={notifRef}>
      <button 
        onClick={() => setShowNotif(!showNotif)}
        className="absolute -top-3 left-6 bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full px-3 py-1 text-xs font-bold shadow-sm z-30 flex items-center gap-1 text-app-black dark:text-zinc-200 cursor-pointer"
      >
        {unreadCount > 0 ? `${unreadCount} Notifications` : 'Notifications'}
      </button>

      <AnimatePresence>
        {showNotif && (
          <div className="absolute right-0 left-0 top-8 z-50">
            <NotificationDropdown hideSubText={true} />
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-4 pt-2">
        <h3 className="font-semibold text-sm text-app-black dark:text-zinc-200">Friends</h3>
        <span className="text-xs text-app-gray dark:text-zinc-400">{current.timeAgo}</span>
        <button onClick={() => respondToRequest({ id: current.id, action: 'block' })} className="text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer">
          <X className="w-4 h-4 animate-spin-hover" />
        </button>
      </div>

      <div className="flex items-center gap-3 bg-[#FCFCFC] dark:bg-zinc-900/50 p-3 rounded-2xl mb-4 text-app-black dark:text-zinc-200 border border-app-border dark:border-zinc-800">
        <div className="relative">
          <ProfileAvatar src={current.avatar} alt={current.name} size="md" glow="turquoise" onClick={handleClick} />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 bg-white dark:bg-zinc-950 shadow-sm select-none z-20">
            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-[#8B4A2B]/10 dark:bg-[#8B4A2B]/20">
              <Heart className="w-2 h-2 text-[#8B4A2B] dark:text-[#8B4A2B] fill-[#8B4A2B] dark:fill-[#8B4A2B]" />
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h4 onClick={handleClick} className="font-bold text-sm leading-tight cursor-pointer hover:underline text-app-black dark:text-zinc-200">{current.name}</h4>
          <p className="text-xs text-app-gray dark:text-zinc-400 leading-tight mt-0.5">{current.actionText}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => respondToRequest({ id: current.id, action: 'block' })} className="flex-1 py-2.5 dark:border-zinc-800 dark:text-zinc-200">Decline</Button>
        <Button onClick={() => respondToRequest({ id: current.id, action: 'okay' })} className="flex-1 py-2.5 bg-[#8B4A2B] text-white hover:bg-[#6F3A22] shadow-md">Connect</Button>
      </div>


    </div>
  );
};
