import React from 'react';
import { Users, MessageSquare, Heart, AlertTriangle, TrendingUp, Eye, BookOpen, Zap } from 'lucide-react';
import { useAdminStats, useAdminActivity } from '@/src/hooks/useAdmin';
import { AdminCharts } from './AdminCharts';
import { cn } from '@/src/lib/utils';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  user_register: { icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  post_created: { icon: BookOpen, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  match: { icon: Heart, color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
  tribe_joined: { icon: Users, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
  report: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  ban: { icon: AlertTriangle, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
  login: { icon: Eye, color: 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800' },
};

export const AdminDashboardPage: React.FC = () => {
  const { data: stats } = useAdminStats();
  const { data: activity = [] } = useAdminActivity();

  const statCards = [
    { label: 'Utilisateurs totaux', value: stats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Actifs 24h', value: stats?.activeUsers24h ?? 0, icon: TrendingUp, color: 'bg-emerald-500', change: '+8%' },
    { label: 'Posts 24h', value: stats?.newPosts24h ?? 0, icon: BookOpen, color: 'bg-violet-500', change: '+15%' },
    { label: 'Messages 24h', value: stats?.messages24h ?? 0, icon: MessageSquare, color: 'bg-cyan-500', change: '+23%' },
    { label: 'Matches totaux', value: stats?.totalMatches ?? 0, icon: Heart, color: 'bg-pink-500', change: '+5%' },
    { label: 'Reports ouverts', value: stats?.openReports ?? 0, icon: AlertTriangle, color: 'bg-amber-500', change: '-3%' },
    { label: 'Posts signalés', value: stats?.flaggedPosts ?? 0, icon: Eye, color: 'bg-red-500', change: '0%' },
    { label: 'Score moyen', value: stats?.avgMatchScore ?? 0, icon: Zap, color: 'bg-indigo-500', change: '+2%', suffix: '%' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.color)}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{card.change}</span>
              </div>
              <p className="text-2xl font-black tracking-tight text-app-black dark:text-white">
                {formatNumber(card.value)}{card.suffix ?? ''}
              </p>
              <p className="text-xs text-app-gray dark:text-zinc-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <AdminCharts />

      {/* Activity Feed */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-app-border dark:border-zinc-800">
          <h3 className="text-sm font-black text-app-black dark:text-white">Activité récente</h3>
          <p className="text-[11px] text-app-gray dark:text-zinc-500">Dernières actions sur la plateforme</p>
        </div>
        <div className="divide-y divide-app-border dark:divide-zinc-800">
          {activity.map((event) => {
            const cfg = ACTIVITY_ICONS[event.type] ?? ACTIVITY_ICONS.login;
            const Icon = cfg.icon;
            return (
              <div key={event.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app-black dark:text-white truncate">
                    <span className="font-bold">{event.userName}</span>
                    <span className="text-app-gray dark:text-zinc-400 ml-1">{event.details}</span>
                  </p>
                </div>
                <span className="text-[11px] text-app-gray dark:text-zinc-500 shrink-0">{timeAgo(event.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
