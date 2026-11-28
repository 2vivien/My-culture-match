import React from 'react';
import { Lock } from 'lucide-react';
import { TRIBE_PRIVATE_NOTICE, type JoinAction } from '@/src/lib/tribeAccess';

interface TribuPrivateNoticeProps {
  joinAction: JoinAction | null;
  onJoinAction: (kind: JoinAction['kind']) => void;
  membershipPending: boolean;
}

/** État dédié quand le serveur répond 403 TRIBE_PRIVATE : explication + action d'adhésion. */
export const TribuPrivateNotice: React.FC<TribuPrivateNoticeProps> = ({
  joinAction,
  onJoinAction,
  membershipPending,
}) => (
  <div
    role="status"
    data-testid="tribu-private-notice"
    className="bg-white dark:bg-zinc-900/60 border border-dashed border-app-border dark:border-zinc-700 rounded-[20px] p-8 flex flex-col items-center text-center gap-3"
  >
    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
      <Lock className="w-5 h-5 text-app-gray dark:text-zinc-400" aria-hidden="true" />
    </div>
    <h3 className="font-black text-sm text-app-black dark:text-zinc-100">{TRIBE_PRIVATE_NOTICE}</h3>
    <p className="text-xs text-app-gray dark:text-zinc-400 max-w-sm leading-relaxed">
      Les publications de cette tribu ne sont visibles que par ses membres. Un modérateur examinera votre demande.
    </p>
    {joinAction && joinAction.kind !== 'owner' && joinAction.kind !== 'leave' && (
      <button
        type="button"
        disabled={membershipPending}
        onClick={() => onJoinAction(joinAction.kind)}
        className={`mt-1 px-5 py-2.5 rounded-full text-xs font-black tracking-wider transition-all ${
          membershipPending ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        } ${
          joinAction.tone === 'secondary'
            ? 'bg-[#E4E6EB] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-app-black dark:text-zinc-200'
            : 'bg-[#8B4A2B] hover:bg-[#6F3A22] text-white shadow-sm'
        }`}
      >
        {joinAction.label}
      </button>
    )}
  </div>
);
