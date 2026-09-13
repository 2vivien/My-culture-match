import React, { useEffect, useState } from 'react';
import { Ban, BellOff, Flag, Scale, ShieldAlert } from 'lucide-react';
import { api } from '@/src/services/api';

type SafetyUser = { id: string; name: string; username: string; avatar: string | null };

export const TrustSafetySection: React.FC = () => {
  const [blocked, setBlocked] = useState<SafetyUser[]>([]);
  const [muted, setMuted] = useState<SafetyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [b, m] = await Promise.all([
      api.get<{ users: SafetyUser[] }>('/api/safety/blocked'),
      api.get<{ users: SafetyUser[] }>('/api/safety/muted'),
    ]);
    setBlocked(b.users); setMuted(m.users);
  };

  useEffect(() => { reload().finally(() => setLoading(false)); }, []);

  if (loading) return <div className="py-12 text-sm text-app-gray">Chargement de Trust & Safety…</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-2xl border border-red-200/60 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 p-5">
        <div className="flex gap-3"><ShieldAlert className="w-5 h-5 text-red-500 mt-0.5" /><div><h2 className="font-black">Trust & Safety</h2><p className="text-sm text-app-gray mt-1">Bloquez, masquez et signalez les comportements indésirables. Les protections serveur restent prioritaires sur l’interface.</p></div></div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4"><Ban className="w-4 h-4" /><h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray">Utilisateurs bloqués</h2></div>
        {blocked.length === 0 ? <p className="text-sm text-app-gray">Aucun utilisateur bloqué.</p> : <div className="space-y-2">{blocked.map((user) => <div key={user.id} className="flex items-center justify-between rounded-xl border border-app-border/50 dark:border-zinc-800 p-3"><div><p className="font-bold text-sm">{user.name}</p><p className="text-xs text-app-gray">@{user.username}</p></div><button className="text-sm font-bold text-[#E27D60]" onClick={async () => { await api.delete(`/api/safety/users/${user.id}/block`); await reload(); }}>Débloquer</button></div>)}</div>}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4"><BellOff className="w-4 h-4" /><h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray">Utilisateurs masqués</h2></div>
        {muted.length === 0 ? <p className="text-sm text-app-gray">Aucun utilisateur masqué.</p> : <div className="space-y-2">{muted.map((user) => <div key={user.id} className="flex items-center justify-between rounded-xl border border-app-border/50 dark:border-zinc-800 p-3"><div><p className="font-bold text-sm">{user.name}</p><p className="text-xs text-app-gray">@{user.username}</p></div><button className="text-sm font-bold text-[#E27D60]" onClick={async () => { await api.delete(`/api/safety/users/${user.id}/mute`); await reload(); }}>Réafficher</button></div>)}</div>}
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-app-border/50 dark:border-zinc-800 p-4"><Flag className="w-4 h-4 mb-3" /><p className="font-bold text-sm">Signalement</p><p className="text-xs text-app-gray mt-1">Depuis un profil, post ou message, utilisez Signaler. Un dossier de modération est créé côté serveur.</p></div>
        <div className="rounded-xl border border-app-border/50 dark:border-zinc-800 p-4"><Scale className="w-4 h-4 mb-3" /><p className="font-bold text-sm">Appel</p><p className="text-xs text-app-gray mt-1">Une sanction peut être contestée. Les appels restent historisés et traitables par la modération.</p></div>
        <div className="rounded-xl border border-app-border/50 dark:border-zinc-800 p-4"><ShieldAlert className="w-4 h-4 mb-3" /><p className="font-bold text-sm">Protection</p><p className="text-xs text-app-gray mt-1">Blocage, consentement, anti-spam messagerie et contrôles de visibilité sont appliqués côté backend.</p></div>
      </section>
    </div>
  );
};
