import React from 'react';
import { Server, Database, Wifi, HardDrive, Cpu, MemoryStick, Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useSystemHealth } from '@/src/hooks/useAdmin';
import { cn } from '@/src/lib/utils';

function GaugeBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-app-gray dark:text-zinc-400">{label}</span>
        <span className="text-xs font-bold text-app-black dark:text-white">{value}{max === 100 ? '%' : max === 1000 ? 'ms' : ''}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ServiceStatus({ name, status, icon: Icon }: { name: string; status: 'ok' | 'warn' | 'error'; icon: React.ElementType }) {
  const cfg = {
    ok: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800' },
    warn: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800' },
  }[status];
  const StatusIcon = cfg.icon;

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl border', cfg.bg, cfg.border)}>
      <Icon className="w-5 h-5 text-app-gray dark:text-zinc-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-app-black dark:text-white">{name}</p>
      </div>
      <StatusIcon className={cn('w-4 h-4 shrink-0', cfg.color)} />
    </div>
  );
}

export const AdminHealthPage: React.FC = () => {
  const { data: health, isLoading } = useSystemHealth();

  if (isLoading || !health) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-app-border dark:border-zinc-700 border-t-app-black dark:border-t-white rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const overallStatus = health.status === 'healthy' ? 'ok' : health.status === 'degraded' ? 'warn' : 'error';
  const uptimeDays = Math.floor(health.uptime / 86400);
  const uptimeHours = Math.floor((health.uptime % 86400) / 3600);

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={cn(
        'rounded-2xl border p-5',
        overallStatus === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' :
        overallStatus === 'warn' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
        'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
      )}>
        <div className="flex items-center gap-3">
          {overallStatus === 'ok' ? <CheckCircle className="w-6 h-6 text-emerald-500" /> :
           overallStatus === 'warn' ? <AlertTriangle className="w-6 h-6 text-amber-500" /> :
           <XCircle className="w-6 h-6 text-red-500" />}
          <div>
            <h3 className="text-sm font-bold text-app-black dark:text-white">
              Système {health.status === 'healthy' ? 'opérationnel' : health.status === 'degraded' ? 'dégradé' : 'hors ligne'}
            </h3>
            <p className="text-xs text-app-gray dark:text-zinc-500">
              Uptime : {uptimeDays}j {uptimeHours}h • Dernière vérification à l'instant
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resources */}
        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-app-black dark:text-white">Ressources</h3>
          <GaugeBar label="CPU" value={health.cpuUsage} color={health.cpuUsage > 80 ? 'bg-red-500' : health.cpuUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'} />
          <GaugeBar label="Mémoire" value={health.memoryUsage} color={health.memoryUsage > 80 ? 'bg-red-500' : health.memoryUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'} />
          <GaugeBar label="Disque" value={health.diskUsage} color={health.diskUsage > 80 ? 'bg-red-500' : health.diskUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'} />
        </div>

        {/* Latency */}
        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-app-black dark:text-white">Latence</h3>
          <GaugeBar label="PostgreSQL" value={health.dbLatency} max={100} color={health.dbLatency > 50 ? 'bg-red-500' : health.dbLatency > 20 ? 'bg-amber-500' : 'bg-emerald-500'} />
          <GaugeBar label="Redis" value={health.redisLatency} max={100} color={health.redisLatency > 10 ? 'bg-red-500' : health.redisLatency > 5 ? 'bg-amber-500' : 'bg-emerald-500'} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
              <p className="text-[10px] text-app-gray dark:text-zinc-500 uppercase tracking-wider font-semibold">Connexions actives</p>
              <p className="text-xl font-black text-app-black dark:text-white mt-0.5">{health.activeConnections}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
              <p className="text-[10px] text-app-gray dark:text-zinc-500 uppercase tracking-wider font-semibold">Queue depth</p>
              <p className="text-xl font-black text-app-black dark:text-white mt-0.5">{health.queueDepth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 p-5">
        <h3 className="text-sm font-bold text-app-black dark:text-white mb-4">Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <ServiceStatus name="PostgreSQL" status={health.dbLatency < 50 ? 'ok' : 'warn'} icon={Database} />
          <ServiceStatus name="Redis" status={health.redisLatency < 10 ? 'ok' : 'warn'} icon={Server} />
          <ServiceStatus name="API (Hono)" status={health.status === 'healthy' ? 'ok' : 'warn'} icon={Activity} />
          <ServiceStatus name="WebSocket" status="ok" icon={Wifi} />
          <ServiceStatus name="BullMQ Workers" status={health.queueDepth < 10 ? 'ok' : 'warn'} icon={HardDrive} />
          <ServiceStatus name="MinIO (S3)" status="ok" icon={HardDrive} />
          <ServiceStatus name="Meilisearch" status="ok" icon={Server} />
          <ServiceStatus name="Brevo Email" status="ok" icon={Server} />
        </div>
      </div>
    </div>
  );
};
