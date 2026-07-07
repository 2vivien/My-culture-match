import React from 'react';
import { Landmark, Compass, Sparkles, Plus, Bell, BellOff, MoreHorizontal } from 'lucide-react';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Button } from '@/src/components/ui/button';

interface TribuHeaderProps {
  joined: boolean;
  setJoined: (j: boolean) => void;
  notificationsOn: boolean;
  setNotificationsOn: (n: boolean) => void;
}

export const TribuHeader: React.FC<TribuHeaderProps> = ({
  joined,
  setJoined,
  notificationsOn,
  setNotificationsOn,
}) => {
  return (
    <>
      {/* 1. Header Banner Image */}
      <div className="relative h-36 md:h-48 rounded-[24px] overflow-hidden bg-[#E27D60] dark:bg-[#c66b50] mt-4 shadow-sm shrink-0">
        <img 
          src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=820&h=360&q=80" 
          alt="Tribe Banner" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/15 dark:bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-between px-10 select-none pointer-events-none">
          <Landmark className="w-24 h-24 text-white opacity-20 transform -rotate-12" />
          <Compass className="w-20 h-20 text-white opacity-15 transform rotate-45" />
          <Sparkles className="w-28 h-28 text-white opacity-10" />
        </div>
      </div>

      {/* 2. Tribe Info and Controls Bar */}
      <div className="relative px-6 pb-4 border-b border-app-border dark:border-zinc-850 shrink-0 bg-white dark:bg-zinc-900 rounded-b-[24px] shadow-xs">
        <div className="absolute -top-10 left-6">
          <div className="p-1 rounded-full bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 shadow-md">
            <TotemAvatar 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80" 
              alt="Yamato Tribe Logo" 
              size="lg" 
              glow="turquoise" 
              level={21}
            />
          </div>
        </div>

        <div className="pt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-app-black dark:text-zinc-100 flex items-center gap-2">
              t/YamatoTribe
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active matchmaking live" />
            </h2>
            <p className="text-xs text-app-gray dark:text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
              Yamato Ancestral Community
            </p>
          </div>

          {/* Buttons Controls */}
          <div className="flex items-center gap-2 select-none">
            <Button variant="outline" className="text-xs font-black rounded-full px-4.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 dark:border-zinc-850 dark:text-zinc-200">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Create Tradition
            </Button>

            <button
              onClick={() => setNotificationsOn(!notificationsOn)}
              className={`w-9.5 h-9.5 rounded-full border border-app-border dark:border-zinc-800 flex items-center justify-center cursor-pointer transition-colors ${
                notificationsOn 
                  ? 'bg-zinc-50 dark:bg-zinc-850 text-[#E27D60] dark:text-[#E27D60]' 
                  : 'bg-white dark:bg-zinc-900 text-app-gray hover:text-app-black dark:hover:text-zinc-200'
              }`}
              title={notificationsOn ? "Mute notifications" : "Receive notifications"}
            >
              {notificationsOn ? <Bell className="w-4.5 h-4.5" /> : <BellOff className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={() => setJoined(!joined)}
              className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wider transition-all cursor-pointer ${
                joined
                  ? 'bg-[#E4E6EB] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-app-black dark:text-zinc-200'
                  : 'bg-[#E27D60] hover:bg-[#c66b50] text-white shadow-sm'
              }`}
            >
              {joined ? 'Joined' : 'Join'}
            </button>

            <button className="w-9.5 h-9.5 rounded-full border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer bg-white dark:bg-zinc-900">
              <MoreHorizontal className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
