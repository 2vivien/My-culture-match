import React from 'react';
import { User, FileText, Users, Heart, AlertTriangle, Ban, LogIn, Settings, Database } from 'lucide-react';
import { useAdminLogs } from '@/src/hooks/useAdmin';
import { cn } from '@/src/lib/utils';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  'report.ban': { icon: Ban, color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400', label: 'Ban' },
  'report.warn': { icon: AlertTriangle, color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', label: 'Avertissement' },
  'report.dismiss': { icon: AlertTriangle, color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400', label: 'Rejeté' },
  'user.login': { icon: LogIn, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', label: 'Connexion' },
  'user.unban': { icon: User, color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', label: 'Débannissement' },
  'post.created': { icon: FileText, color: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', label: 'Post créé' },
  'tribe.joined': { icon: Users, color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400', label: 'Communauté rejointe' },
  'match.created': { icon: Heart, color: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400', label: 'Match' },
  'stories.cleanup': { icon: Database, color: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400', label: 'Nettoyage' },
};

export const AdminLogsPage: React.FC = () => {
  const { data: logs = [], isLoading } = useAdminLogs();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-app-black dark:text-white">Journal d'audit</h3>
            <p className="text-xs text-app-gray dark:text-zinc-500 mt-0.5">
              {logs.length} entrées • Actions des admins et événements système
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <Settings className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Auto-refresh</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-app-border dark:border-zinc-700 border-t-app-black dark:border-t-white rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="divide-y divide-app-border dark:divide-zinc-800">
            {logs.map((log, i) => {
              const cfg = ACTION_CONFIG[log.action] ?? { icon: Settings, color: 'bg-gray-100 text-gray-500', label: log.action };
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-0.5">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {i < logs.length - 1 && <div className="w-px h-full bg-app-border dark:bg-zinc-800 mt-2" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-app-black dark:text-white">{cfg.label}</span>
                      <span className="text-[11px] text-app-gray dark:text-zinc-500">•</span>
                      <span className="text-[11px] text-app-gray dark:text-zinc-500">{log.userName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {Object.entries(log.metadata).map(([key, val]) => (
                        <span key={key} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-app-gray dark:text-zinc-400 font-mono">
                          {key}: {String(val)}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {log.ipAddress && (
                        <span className="text-[10px] text-app-gray dark:text-zinc-600 font-mono">IP: {log.ipAddress}</span>
                      )}
                      <span className="text-[11px] text-app-gray dark:text-zinc-500">{timeAgo(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
