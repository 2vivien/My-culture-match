import React from 'react';
import { Check, X, Loader2, UserPlus } from 'lucide-react';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import type { JoinRequest } from '@/src/services/tribuService';

interface TribuJoinRequestsProps {
  requests: JoinRequest[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onResolve: (userId: string, approve: boolean) => void;
  resolvingUserId: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Demandes d'adhésion en attente — affiché uniquement pour owner/moderator d'une tribu privée. */
export const TribuJoinRequests: React.FC<TribuJoinRequestsProps> = ({
  requests,
  loading,
  error,
  onRetry,
  onResolve,
  resolvingUserId,
}) => (
  <section
    aria-label="Demandes d’adhésion"
    data-testid="tribu-join-requests"
    className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[20px] p-5 shadow-xs"
  >
    <h3 className="font-extrabold text-sm text-app-black dark:text-zinc-200 flex items-center gap-2">
      <UserPlus className="w-4 h-4 text-[#8B4A2B]" aria-hidden="true" />
      Demandes d’adhésion
      {requests.length > 0 && (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#8B4A2B]/10 text-[#8B4A2B]">
          {requests.length}
        </span>
      )}
    </h3>

    <div className="mt-3 flex flex-col gap-2.5" aria-live="polite">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-app-gray font-semibold" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Chargement des demandes…
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center justify-between gap-2">
          <span>Impossible de charger les demandes.</span>
          <button type="button" onClick={onRetry} className="underline cursor-pointer">
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <p className="text-xs text-app-gray dark:text-zinc-500 font-semibold">Aucune demande en attente.</p>
      )}

      {!loading &&
        !error &&
        requests.map((r) => {
          const busy = resolvingUserId === r.userId;
          const label = r.username ? `@${r.username}` : r.name;
          return (
            <div key={r.userId} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <ProfileAvatar src={r.avatar ?? ''} alt={r.name} size="xs" glow="none" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-app-black dark:text-zinc-100 truncate">{r.name}</p>
                  <p className="text-[10px] text-app-gray dark:text-zinc-500 truncate">
                    {r.username ? label : ''}
                    {r.username && formatDate(r.createdAt) ? ' · ' : ''}
                    {formatDate(r.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onResolve(r.userId, true)}
                  aria-label={`Approuver la demande de ${r.name}`}
                  className="px-2.5 py-1.5 rounded-full bg-[#8B4A2B] hover:bg-[#6F3A22] text-white text-[10px] font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Check className="w-3 h-3" aria-hidden="true" />}
                  Approuver
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onResolve(r.userId, false)}
                  aria-label={`Refuser la demande de ${r.name}`}
                  className="px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-app-black dark:text-zinc-200 text-[10px] font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                  Refuser
                </button>
              </div>
            </div>
          );
        })}
    </div>
  </section>
);
