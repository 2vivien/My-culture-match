import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Ban, Eye, Shield, MessageSquare, User, FileText } from 'lucide-react';
import { useAdminReports, useReportAction } from '@/src/hooks/useAdmin';
import { cn } from '@/src/lib/utils';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

const TARGET_ICONS: Record<string, React.ElementType> = {
  user: User, post: FileText, comment: MessageSquare, message: MessageSquare,
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  reviewed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  actioned: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  dismissed: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
};

const REASON_LABELS: Record<string, string> = {
  harassment: 'Harcèlement', spam: 'Spam', hate_speech: 'Discours haineux',
  nswf: 'Contenu NSFW', violence: 'Violence', other: 'Autre',
};

export const AdminReportsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionModal, setActionModal] = useState<{ reportId: string; action: string } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const { data: reports = [], isLoading } = useAdminReports(statusFilter || undefined);
  const reportAction = useReportAction();

  const statusOptions = [
    { value: '', label: 'Tous', count: reports.length },
    { value: 'open', label: 'Ouverts' },
    { value: 'reviewed', label: 'En revue' },
    { value: 'actioned', label: 'Traités' },
    { value: 'dismissed', label: 'Rejetés' },
  ];

  const handleAction = (reportId: string, action: string) => {
    setActionModal({ reportId, action });
    setActionReason('');
  };

  const confirmAction = () => {
    if (!actionModal) return;
    reportAction.mutate(
      { reportId: actionModal.reportId, action: actionModal.action as any, reason: actionReason || undefined },
      { onSuccess: () => setActionModal(null) }
    );
  };

  return (
    <div className="space-y-4">
      {/* Status Filters */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 w-fit">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none',
              statusFilter === opt.value
                ? 'bg-white dark:bg-zinc-700 text-app-black dark:text-white shadow-sm'
                : 'text-app-gray dark:text-zinc-400 hover:text-app-black dark:hover:text-white bg-transparent'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-app-border dark:border-zinc-700 border-t-app-black dark:border-t-white rounded-full animate-spin mx-auto" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-app-black dark:text-white">Aucun signalement</p>
            <p className="text-xs text-app-gray dark:text-zinc-500 mt-1">Tout est propre !</p>
          </div>
        ) : (
          reports.map((report) => {
            const TargetIcon = TARGET_ICONS[report.targetType] ?? FileText;
            return (
              <div key={report.id} className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    report.status === 'open' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-gray-100 dark:bg-zinc-800'
                  )}>
                    <TargetIcon className={cn('w-5 h-5', report.status === 'open' ? 'text-amber-600 dark:text-amber-400' : 'text-app-gray dark:text-zinc-400')} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold', STATUS_STYLES[report.status])}>
                        {report.status}
                      </span>
                      <span className="text-[11px] text-app-gray dark:text-zinc-500">{report.targetType}</span>
                      <span className="text-[11px] text-app-gray dark:text-zinc-500">•</span>
                      <span className="text-[11px] text-app-gray dark:text-zinc-500">{timeAgo(report.createdAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-app-black dark:text-white">
                      {report.reason ? (REASON_LABELS[report.reason] ?? report.reason) : 'Signalement'}
                    </p>
                    {report.description && (
                      <p className="text-xs text-app-gray dark:text-zinc-400 mt-0.5">{report.description}</p>
                    )}
                    <p className="text-[11px] text-app-gray dark:text-zinc-500 mt-1">
                      Signalé par <span className="font-semibold">{report.reporterName}</span>
                    </p>
                    {report.resolution && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        Résolution : {report.resolution}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {report.status === 'open' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleAction(report.id, 'dismiss')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer bg-transparent border-none" title="Rejeter">
                        <Eye className="w-4 h-4 text-app-gray dark:text-zinc-400" />
                      </button>
                      <button onClick={() => handleAction(report.id, 'warn')} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer bg-transparent border-none" title="Avertir">
                        <Shield className="w-4 h-4 text-amber-500" />
                      </button>
                      <button onClick={() => handleAction(report.id, 'ban')} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer bg-transparent border-none" title="Bannir">
                        <Ban className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setActionModal(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-app-border dark:border-zinc-800 w-full max-w-md mx-4 shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-app-black dark:text-white mb-1">
              Action : {actionModal.action === 'dismiss' ? 'Rejeter' : actionModal.action === 'warn' ? 'Avertir' : actionModal.action === 'suspend' ? 'Suspendre' : 'Bannir'}
            </h3>
            <p className="text-xs text-app-gray dark:text-zinc-500 mb-4">Report #{actionModal.reportId}</p>
            <textarea
              placeholder="Raison (optionnel)..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-app-border dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-app-black dark:text-white focus:outline-none focus:ring-2 focus:ring-app-black dark:focus:ring-zinc-600 resize-none h-20"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setActionModal(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-app-gray dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer bg-transparent border-none">
                Annuler
              </button>
              <button
                onClick={confirmAction}
                disabled={reportAction.isPending}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer border-none transition-colors disabled:opacity-50',
                  actionModal.action === 'ban' ? 'bg-red-500 hover:bg-red-600' :
                  actionModal.action === 'warn' ? 'bg-amber-500 hover:bg-amber-600' :
                  'bg-[#E27D60] hover:bg-[#c66b50]'
                )}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
