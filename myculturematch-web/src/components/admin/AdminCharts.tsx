import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAdminAnalytics } from '@/src/hooks/useAdmin';
import { cn } from '@/src/lib/utils';

// ── Chart Components ──

function ChartCard({ title, subtitle, children, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-app-border dark:border-zinc-800">
        <h3 className="text-sm font-black text-app-black dark:text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-app-gray dark:text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl px-3 py-2 shadow-xl border border-zinc-700">
      <p className="text-[11px] font-bold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-[11px] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-bold">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export const AdminCharts: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const { data: analytics } = useAdminAnalytics(period);

  const activityData = (analytics?.activity ?? []).map((d) => ({ ...d, name: d.label }));
  const growthData = analytics?.growth ?? [];
  const reportData = analytics?.reportDistribution ?? [];
  const scoreData = analytics?.scoreDistribution ?? [];
  const engagementData = analytics?.engagement ?? [];

  const periods = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '12m', label: '12 mois' },
  ];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-app-gray dark:text-zinc-500">Période :</span>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none',
                period === p.value
                  ? 'bg-white dark:bg-zinc-700 text-app-black dark:text-white shadow-sm'
                  : 'text-app-gray dark:text-zinc-400 hover:text-app-black dark:hover:text-white bg-transparent'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: User Activity (Area) + Report Distribution (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Activity Area Chart */}
        <ChartCard title="Activité hebdomadaire" subtitle="Utilisateurs, posts et messages" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="utilisateurs" name="Utilisateurs" stroke="#6366f1" fill="url(#gradUsers)" strokeWidth={2} />
              <Area type="monotone" dataKey="posts" name="Posts" stroke="#10b981" fill="url(#gradPosts)" strokeWidth={2} />
              <Area type="monotone" dataKey="messages" name="Messages" stroke="#f59e0b" fill="url(#gradMessages)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Report Distribution Pie */}
        <ChartCard title="Signalements" subtitle="Par catégorie">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={reportData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {reportData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Monthly Growth (Bar) + Match Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Growth Bar Chart */}
        <ChartCard title="Croissance mensuelle" subtitle="Nouveaux utilisateurs et tribus">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="utilisateurs" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tribus" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Match Score Distribution */}
        <ChartCard title="Scores de compatibilité" subtitle="Distribution des match scores">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreData.map((entry, i) => (
                  <Cell key={i} fill={['#cbd5e1', '#94a3b8', '#6366f1', '#8b5cf6', '#a855f7'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Engagement Line Chart */}        <ChartCard title="Engagement par heure" subtitle="Likes, commentaires et partages au cours de la journée">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="comments" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="shares" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
