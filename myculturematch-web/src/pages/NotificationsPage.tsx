import { useState } from 'react';
import { Award, Heart, MessageCircle, UserPlus, Sparkles, CheckCheck, Trash2, Settings2 } from 'lucide-react';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useUIStore } from '@/src/stores/useUIStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import type { NotificationItem } from '@/src/types/notification';

const ICONS: Record<NotificationItem['type'], typeof Award> = {
  comment: MessageCircle,
  invite: UserPlus,
  like: Heart,
  generation: Sparkles,
};

export const NotificationsPage = () => {
  const { displayedNotifications, markAllRead, toggleReadState } = useNotifications();
  const { setActiveTab } = useUIStore();
  const [cleared, setCleared] = useState(false);

  const items = cleared ? [] : displayedNotifications;

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full h-full overflow-y-auto hide-scrollbar px-1 pb-10 select-none">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black tracking-tight text-app-black dark:text-zinc-100">
          Notifications
        </h1>
        <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-300">
          <button
            onClick={() => markAllRead()}
            className="text-xs font-bold cursor-pointer hover:text-app-black dark:hover:text-white"
          >
            Mark all as read
          </button>
          <button
            onClick={() => setCleared(true)}
            title="Clear"
            className="cursor-pointer hover:text-app-black dark:hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('Settings')}
            title="Notification settings"
            className="cursor-pointer hover:text-app-black dark:hover:text-white"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-5 py-10 text-center">
          <CheckCheck className="w-6 h-6 mx-auto mb-3 text-zinc-400" />
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
            {cleared ? 'Notifications cleared.' : 'You are all caught up.'}
          </p>
          {cleared && (
            <button
              onClick={() => setCleared(false)}
              className="mt-2 text-xs font-bold underline cursor-pointer text-zinc-500"
            >
              Restore
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => {
            const Icon = ICONS[item.type] ?? Award;
            return (
              <button
                key={item.id}
                onClick={() => toggleReadState(item.id)}
                className={`w-full text-left px-5 py-4 flex items-start gap-3.5 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors ${
                  item.isUnread
                    ? 'bg-zinc-100 dark:bg-zinc-800/70'
                    : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-app-black dark:text-zinc-100">
                    {item.user.name} {item.user.action}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {item.user.subText ?? 'MyCultureMatch'}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{item.time}</p>
                </div>
                {item.user.avatar && (
                  <ProfileAvatar src={item.user.avatar} alt={item.user.name} size="xs" glow="none" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <footer className="mt-10 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        About · Privacy Policy · User Agreement · Accessibility · MyCultureMatch © 2026
      </footer>
    </main>
  );
};
