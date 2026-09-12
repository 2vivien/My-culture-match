import React, { useState } from 'react';
import { LayoutDashboard, Users, ShieldAlert, Activity, Server, ChevronLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { AdminDashboardPage } from '@/src/components/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/src/components/admin/AdminUsersPage';
import { AdminReportsPage } from '@/src/components/admin/AdminReportsPage';
import { AdminLogsPage } from '@/src/components/admin/AdminLogsPage';
import { AdminHealthPage } from '@/src/components/admin/AdminHealthPage';
import { useUIStore } from '@/src/stores/useUIStore';

type AdminTab = 'dashboard' | 'users' | 'reports' | 'logs' | 'health';

const ADMIN_TABS: { id: AdminTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Vue d\'ensemble' },
  { id: 'users', label: 'Utilisateurs', icon: Users, description: 'Gestion des comptes' },
  { id: 'reports', label: 'Modération', icon: ShieldAlert, description: 'Signalements' },
  { id: 'logs', label: 'Activity Logs', icon: Activity, description: 'Journal d\'audit' },
  { id: 'health', label: 'Système', icon: Server, description: 'Monitoring' },
];

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const { setActiveTab: setAppTab } = useUIStore();

  const currentPage = ADMIN_TABS.find((t) => t.id === activeTab);

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 shrink-0 border-r border-app-border dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-app-border dark:border-zinc-800">
          <button
            onClick={() => setAppTab('Home')}
            className="flex items-center gap-2 text-xs font-medium text-app-gray dark:text-zinc-400 hover:text-app-black dark:hover:text-white transition-colors mb-3 cursor-pointer bg-transparent border-none"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Retour à l'app
          </button>
          <h2 className="text-sm font-black tracking-tight text-app-black dark:text-white">Admin Panel</h2>
          <p className="text-[11px] text-app-gray dark:text-zinc-500 mt-0.5">My Culture Match</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2.5 flex flex-col gap-0.5">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-none w-full text-left',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-white shadow-none'
                    : 'text-app-gray dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-app-black dark:hover:text-white'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : '')} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-app-border dark:border-zinc-800">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-app-gray dark:text-zinc-500">Système opérationnel</span>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-zinc-950/50">
        {/* Page Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-app-border dark:border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black tracking-tight text-app-black dark:text-white">
                {currentPage?.label}
              </h1>
              <p className="text-xs text-app-gray dark:text-zinc-500 mt-0.5">
                {currentPage?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && <AdminDashboardPage />}
          {activeTab === 'users' && <AdminUsersPage />}
          {activeTab === 'reports' && <AdminReportsPage />}
          {activeTab === 'logs' && <AdminLogsPage />}
          {activeTab === 'health' && <AdminHealthPage />}
        </div>
      </main>
    </div>
  );
};
