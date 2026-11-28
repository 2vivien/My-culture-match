import React from 'react';
import type { TribeInfo } from '@/src/hooks/useTribu';
import { visibilityLabel } from '@/src/lib/tribeAccess';

interface TribuAboutProps {
  tribeInfo?: TribeInfo | null;
}

export const TribuAbout: React.FC<TribuAboutProps> = ({ tribeInfo }) => {
  const displayName = tribeInfo?.name ?? 'Tribu';
  const createdDate = tribeInfo?.createdAt
    ? new Date(tribeInfo.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[20px] p-5 shadow-xs">
      <h3 className="font-extrabold text-sm text-app-black dark:text-zinc-200">
        À propos de {displayName}
      </h3>
      <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed mt-2.5">
        {tribeInfo?.description ||
          `Discussion hub de la tribu ${displayName} : découvrez les traditions, langues et célébrations transmises de génération en génération.`}
      </p>

      {/* Created info */}
      <div className="mt-4 pt-3 border-t border-app-border/70 dark:border-zinc-800 text-[11px] text-app-gray dark:text-zinc-400 font-bold flex justify-between">
        <span>{createdDate ? `Créée le ${createdDate}` : 'Communauté'}</span>
        <span className="text-[#E27D60] dark:text-[#E27D60]">
          {tribeInfo?.visibility === 'private' ? 'Tribu privée' : 'Tribu publique'}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mt-5 pt-3 border-t border-app-border/70 dark:border-zinc-800">
        <div>
          <span className="font-black text-base text-app-black dark:text-zinc-100">
            {tribeInfo?.membersCount ?? 0}
          </span>
          <p className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase mt-0.5">
            Membres
          </p>
        </div>
        <div>
          <span className="font-black text-base text-app-black dark:text-zinc-100">
            {visibilityLabel(tribeInfo?.visibility)}
          </span>
          <p className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase mt-0.5">
            Accès
          </p>
        </div>
      </div>
    </div>
  );
};
