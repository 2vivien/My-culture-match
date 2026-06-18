import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, MessageCircle, Check, X, ShieldAlert, Heart, Calendar } from 'lucide-react';
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

interface NotificationDropdownProps {
  hideSubText?: boolean;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ hideSubText = false }) => {
  const { setNotificationsCount } = useUIStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      user: {
        name: 'AinuScholar',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
        action: 'commented on your tradition',
        target: 'Benin Voodoo rhythms study',
      },
      type: 'comment',
      time: '1h ago',
      isUnread: true,
    },
    {
      id: '2',
      user: {
        name: 'YamatoElder',
        avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=80&q=80',
        action: 'liked your tradition',
        target: 'Shinto festival restoration project',
      },
      type: 'like',
      time: '1h ago',
      isUnread: true,
    },
    {
      id: '3',
      user: {
        name: 'HakaNavigator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
        action: 'invited you to collaborate on',
        target: 'Pacific Rhythm Matchmaking',
      },
      type: 'invite',
      time: '1h ago',
      isUnread: true,
    },
    {
      id: '4',
      user: {
        name: 'Luna',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
        action: 'liked your shared image in',
        target: 't/AinuTribe',
      },
      type: 'like',
      time: '1h ago',
      isUnread: false,
    },
  ]);

  // Sync count to global state store dynamically on change
  useEffect(() => {
    const unread = notifications.filter(n => n.isUnread).length;
    setNotificationsCount(unread);
  }, [notifications, setNotificationsCount]);

  const displayed = notifications.filter((n) => (filter === 'unread' ? n.isUnread : true));

  const handleAction = (id: string, actionName: 'accept' | 'decline') => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const toggleReadState = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: !n.isUnread } : n))
    );
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
          <Bell className="w-4 h-4 text-[#6c63fc] dark:text-[#2dd9d9] animate-pulse" />
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
              onClick={() => toggleReadState(item.id)}
              className={`p-2.5 rounded-2xl flex gap-3 transition-colors relative group cursor-pointer ${
                item.isUnread ? 'bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-850/50' : 'hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20'
              }`}
            >
              {/* Badge avatar indicator overlay style */}
              <div className="relative shrink-0 select-none">
                <img
                  src={item.user.avatar}
                  alt={item.user.name}
                  className="w-10 h-10 rounded-full object-cover border border-app-border"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 bg-white dark:bg-zinc-950 shadow-xs">
                  {item.type === 'comment' && (
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-[#E27D60]/10 dark:bg-[#E27D60]/20">
                      <MessageCircle className="w-2 h-2 text-[#E27D60] dark:text-[#E27D60]" />
                    </span>
                  )}
                  {item.type === 'generation' && (
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50">
                      <Bell className="w-2 h-2 text-emerald-600 dark:text-emerald-400" />
                    </span>
                  )}
                  {item.type === 'invite' && (
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-purple-50 dark:bg-purple-950/50">
                      <Calendar className="w-2 h-2 text-purple-600 dark:text-purple-400" />
                    </span>
                  )}
                  {item.type === 'like' && (
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-[#E27D60]/10 dark:bg-[#E27D60]/20">
                      <Heart className="w-2 h-2 text-[#E27D60] dark:text-[#E27D60] fill-[#E27D60] dark:fill-[#E27D60]" />
                    </span>
                  )}
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



                {/* Accept / Decline actions */}
                {item.type === 'invite' && (
                  <div className="flex gap-2.5 mt-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(item.id, 'decline');
                      }}
                      className="px-4.5 py-2 text-xs font-black bg-[#E4E6EB] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-app-black dark:text-zinc-200 rounded-xl cursor-pointer transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(item.id, 'accept');
                      }}
                      className="px-4.5 py-2 text-xs font-black bg-[#1A1A1A] hover:opacity-90 dark:bg-white text-white dark:text-app-black rounded-xl cursor-pointer transition-colors"
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
          className="text-[10px] font-bold text-[#E27D60] dark:text-[#E27D60] hover:underline cursor-pointer"
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
