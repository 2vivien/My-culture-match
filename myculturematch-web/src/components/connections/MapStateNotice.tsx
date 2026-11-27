import React from 'react';
import { AlertTriangle, RefreshCw, UsersRound } from 'lucide-react';
import { GEO_MESSAGES, type GeoProblem } from '@/src/lib/mapState';

interface Props {
  status: 'error' | 'empty';
  geoProblem?: GeoProblem | null;
  onRetry: () => void;
}

/** Message centré sur la carte : erreur de chargement / de localisation, ou aucune personne à proximité. */
export const MapStateNotice: React.FC<Props> = ({ status, geoProblem, onRetry }) => {
  const geo = geoProblem ? GEO_MESSAGES[geoProblem] : null;
  const isError = status === 'error' || Boolean(geo);
  const title = geo?.title ?? (status === 'error' ? 'Impossible de charger la carte' : 'Personne à proximité pour l’instant');
  const hint = geo?.hint ?? (status === 'error' ? 'Vérifie ta connexion puis réessaie.' : 'Élargis tes filtres ou reviens plus tard : la carte se met à jour quand des personnes partagent leur zone.');
  const Icon = isError ? AlertTriangle : UsersRound;

  return (
    <div className="absolute inset-x-4 top-[210px] z-30 mx-auto max-w-sm pointer-events-none" role={isError ? 'alert' : 'status'}>
      <div className="pointer-events-auto bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl text-center">
        <Icon className={`w-6 h-6 mx-auto ${isError ? 'text-amber-500' : 'text-zinc-500'}`} aria-hidden />
        <h3 className="mt-2 text-sm font-black">{title}</h3>
        <p className="mt-1 text-xs text-zinc-500 leading-5">{hint}</p>
        {(isError || status === 'empty') && (
          <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-black">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden /> Réessayer
          </button>
        )}
      </div>
    </div>
  );
};
