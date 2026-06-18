import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Check, X, ShieldAlert, Heart, Calendar } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';

interface NotificationItem {
  id: string;
  user: {
    name: string;
    avatar: string;
    action: string;
    target: string;
    subText?: string;
  };
  type: 'comment' | 'invite' | 'like' | 'generation';
  time: string;
  isUnread?: boolean;
}

export const NotificationDropdown: React.FC = () => {
  const { setNotificationsCount } = useUIStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      user: {
        name: 'Pixelwave',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80',
        action: 'Commented on',
        target: 'Classic Car in Studio',
        subText: 'These draggable sliders look really cool. Maybe these could be displayed when you hold shift...',
      },
      type: 'comment',
      time: '1h ago',
      isUnread: true,
    },
    {
      id: '2',
      user: {
        name: 'Cute Turtle is generated',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
        action: 'Matte texture',
        target: 'UI8 Style',
      },
      type: 'generation',
      time: '1h ago',
      isUnread: true,
    },
    {
      id: '3',
      user: {
        name: '3D object is generated',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80',
        action: 'Invited you to edit',
        target: 'Minimalist Architecture Scene',
      },
      type: 'invite',
      time: '1h ago',
      isUnread: true,
    },
    {
      id: '4',
      user: {
        name: 'Luna',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
        action: 'Liked',
        target: 'Classic Car in Studio',
      },
      type: 'like',
      time: '2h ago',
      isUnread: false,
    },
    {
      id: '5',
      user: {
        name: 'Norse Voyager',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
        action: 'Invited you to',
        target: 'Midsummer Solstice Ritual',
      },
      type: 'invite',
      time: '1d ago',
      isUnread: false,
    },
  ]);

  const displayed = notifications.filter((n) => (filter === 'unread' ? n.isUnread : true));

  const handleAction = (id: string, actionName: 'accept' | 'decline') => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // Decrease global unread notifications dynamically
    setNotificationsCount(Math.max(0, notifications.filter(n => n.isUnread).length - 1));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    setNotificationsCount(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-32px)] bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[24px] shadow-xl overflow-hidden z-50 p-4"
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between pb-3 border-b border-app-border dark:border-zinc-850">
        <h3 className="font-black text-sm text-app-black dark:text-zinc-100 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          Notifications
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors ${
              filter === 'all'
                ? 'bg-app-black text-white dark:bg-white dark:text-app-black'
                : 'text-app-gray hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors ${
              filter === 'unread'
                ? 'bg-app-black text-white dark:bg-white dark:text-app-black'
                : 'text-app-gray hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Popover Body list */}
      <div className="mt-3 space-y-3.5 max-h-[360px] overflow-y-auto pr-1 hide-scrollbar">
        {displayed.length > 0 ? (
          displayed.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-2xl flex gap-3 transition-colors relative group ${
                item.isUnread ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''
              }`}
            >
              {/* Badge avatar indicator overlay style */}
              <div className="relative shrink-0 select-none">
                <img
                  src={item.user.avatar}
                  alt={item.user.name}
                  className="w-10 h-10 rounded-full object-cover border border-app-border"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950">
                  {item.type === 'comment' && <MessageSquare className="w-2.5 h-2.5 text-blue-600 bg-blue-50 dark:bg-zinc-800 w-full h-full p-0.5 rounded-full" />}
                  {item.type === 'generation' && <Sparkles className="w-2.5 h-2.5 text-emerald-600 bg-emerald-50 dark:bg-zinc-800 w-full h-full p-0.5 rounded-full" />}
                  {item.type === 'invite' && <Calendar className="w-2.5 h-2.5 text-purple-600 bg-purple-50 dark:bg-zinc-800 w-full h-full p-0.5 rounded-full" />}
                  {item.type === 'like' && <Heart className="w-2.5 h-2.5 text-rose-600 bg-rose-50 dark:bg-zinc-800 w-full h-full p-0.5 rounded-full fill-rose-600" />}
                </span>
              </div>

              {/* Text content details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs truncate text-app-black dark:text-zinc-200">
                    {item.user.name}
                  </span>
                  <span className="text-[9px] text-app-gray dark:text-zinc-500 font-medium tracking-tight">
                    {item.time}
                  </span>
                </div>
                <p className="text-[11px] text-app-gray dark:text-zinc-400 mt-0.5 leading-snug">
                  {item.user.action}{' '}
                  <span className="font-black text-app-black dark:text-zinc-200">
                    {item.user.target}
                  </span>
                </p>

                {item.user.subText && (
                  <p className="text-[10px] text-app-gray/80 dark:text-zinc-500 mt-1 italic line-clamp-2 bg-white dark:bg-zinc-900/40 p-1.5 rounded-lg border border-app-border/40">
                    {item.user.subText}
                  </p>
                )}

                {/* Actions Accept / Decline button overlay */}
                {item.type === 'invite' && (
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={() => handleAction(item.id, 'decline')}
                      className="px-4 py-1.5 text-[10px] font-black bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-black dark:text-zinc-200 rounded-xl cursor-pointer transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'accept')}
                      className="px-4 py-1.5 text-[10px] font-black bg-app-black dark:bg-white hover:opacity-90 text-white dark:text-app-black rounded-xl cursor-pointer transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>

              {/* Unread indicator dot */}
              {item.isUnread && (
                <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-xs text-app-gray select-none">
            No active notifications in this category.
          </div>
        )}
      </div>

      {/* Dropdown footer summary */}
      <div className="mt-3 pt-2.5 border-t border-app-border dark:border-zinc-850 flex items-center justify-between select-none">
        <button
          onClick={markAllRead}
          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          Mark all as read
        </button>
        <span className="text-[9px] text-app-gray dark:text-zinc-500 font-bold uppercase tracking-widest">
          MyCultureMatch Synergy
        </span>
      </div>
    </motion.div>
  );
};
