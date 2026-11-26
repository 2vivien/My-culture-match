import React, { useEffect, useState } from 'react';
import { ShieldCheck, Heart, Users, MessageCircle, Eye, Image, Globe2, UserRoundCheck } from 'lucide-react';
import { ToggleRow } from '../rows/ToggleRow';
import { api } from '@/src/services/api';

type Visibility = 'nobody' | 'friends' | 'friends_of_friends' | 'nearby' | 'everyone';
type ConsentSettings = {
  discoveryVisibility: Visibility;
  requestVisibility: Visibility;
  loveLikeVisibility: Visibility;
  contactVisibility: Visibility;
  profileVisibility: Visibility;
  photosVisibility: Visibility;
  countryVisibility: Visibility;
  friendshipEnabled: boolean;
  loveEnabled: boolean;
  loveProposalEnabled: boolean;
};

const visibilityOptions: Array<{ value: Visibility; label: string }> = [
  { value: 'everyone', label: 'Tout le monde' },
  { value: 'friends', label: 'Mes amis' },
  { value: 'friends_of_friends', label: 'Amis de mes amis' },
  { value: 'nearby', label: 'Personnes à proximité' },
  { value: 'nobody', label: 'Personne' },
];

const defaultSettings: ConsentSettings = {
  discoveryVisibility: 'everyone', requestVisibility: 'everyone', loveLikeVisibility: 'everyone', contactVisibility: 'friends',
  profileVisibility: 'everyone', photosVisibility: 'friends', countryVisibility: 'everyone', friendshipEnabled: true, loveEnabled: false, loveProposalEnabled: true,
};

export const PrivacySection: React.FC = () => {
  const [settings, setSettings] = useState<ConsentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<{ success: boolean; settings: ConsentSettings }>('/api/consent/settings')
      .then((result) => { if (active) setSettings(result.settings); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = async (patch: Partial<ConsentSettings>) => {
    setSaving(true); setSaved(false);
    try {
      const result = await api.patch<{ success: boolean; settings: ConsentSettings }>('/api/consent/settings', patch);
      setSettings(result.settings); setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } finally { setSaving(false); }
  };

  const select = (label: string, value: Visibility, onChange: (value: Visibility) => void) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-app-border/40 dark:border-zinc-800/40">
      <span className="text-sm font-extrabold text-app-black dark:text-zinc-200">{label}</span>
      <select value={value} disabled={saving} onChange={(e) => onChange(e.target.value as Visibility)} className="min-w-52 px-3.5 py-2 text-sm rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-400">
        {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );

  if (loading) return <div className="py-12 text-sm text-app-gray">Chargement de vos préférences de confidentialité…</div>;

  return (
    <div className="space-y-9 animate-fade-in">
      <div className="rounded-2xl border border-app-border/50 dark:border-zinc-800 p-5 bg-zinc-50/70 dark:bg-zinc-900/40">
        <div className="flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-zinc-700 dark:text-zinc-200 mt-0.5" />
          <div><h2 className="font-black text-app-black dark:text-zinc-100">Consentement et contrôle</h2><p className="text-sm text-app-gray mt-1">Chaque interaction sociale et Love possède maintenant sa propre autorisation. Un blocage ou une préférence restrictive est toujours prioritaire.</p></div>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-app-gray" /><h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray">Friendship</h2></div>
        <ToggleRow title="Activer Friendship" description="Autoriser les autres à me proposer une connexion amicale" isActive={settings.friendshipEnabled} onToggle={() => update({ friendshipEnabled: !settings.friendshipEnabled })} />
        {select('Qui peut m’envoyer une demande ?', settings.requestVisibility, (value) => update({ requestVisibility: value }))}
        {select('Qui peut me découvrir dans Friendship ?', settings.discoveryVisibility, (value) => update({ discoveryVisibility: value }))}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-zinc-700 dark:text-zinc-200" /><h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray">Love</h2></div>
        <div className="mb-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 p-4 text-sm text-app-gray"><strong className="text-app-black dark:text-zinc-100">Love ≠ Friendship.</strong> Les likes, propositions et matchs amoureux sont isolés du système Friendship. Activer Love ne change pas vos demandes d’amitié.</div>
        <ToggleRow title="Activer Love" description="Je souhaite participer au matching amoureux" isActive={settings.loveEnabled} onToggle={() => update({ loveEnabled: !settings.loveEnabled, loveProposalEnabled: !settings.loveEnabled })} />
        <ToggleRow title="Accepter les propositions Love" description="Autoriser les autres utilisateurs Love à me proposer une relation" isActive={settings.loveProposalEnabled} onToggle={() => update({ loveProposalEnabled: !settings.loveProposalEnabled })} />
        {select('Qui peut me liker pour Love ?', settings.loveLikeVisibility, (value) => update({ loveLikeVisibility: value }))}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3"><MessageCircle className="w-4 h-4 text-app-gray" /><h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray">Contact</h2></div>
        {select('Qui peut me contacter ?', settings.contactVisibility, (value) => update({ contactVisibility: value }))}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3"><Eye className="w-4 h-4 text-app-gray" /><h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray">Profil et identité</h2></div>
        {select('Qui peut voir mon profil ?', settings.profileVisibility, (value) => update({ profileVisibility: value }))}
        <div className="flex items-center gap-2 mt-5 mb-2"><Image className="w-4 h-4 text-app-gray" /><span className="text-xs uppercase font-extrabold tracking-wider text-app-gray">Photos</span></div>
        {select('Qui peut voir mes photos ?', settings.photosVisibility, (value) => update({ photosVisibility: value }))}
        <div className="flex items-center gap-2 mt-5 mb-2"><Globe2 className="w-4 h-4 text-app-gray" /><span className="text-xs uppercase font-extrabold tracking-wider text-app-gray">Pays</span></div>
        {select('Qui peut voir mon pays ?', settings.countryVisibility, (value) => update({ countryVisibility: value }))}
      </section>

      <div className="flex items-center gap-2 text-xs text-app-gray"><UserRoundCheck className="w-4 h-4" />{saving ? 'Enregistrement…' : saved ? 'Préférences enregistrées' : 'Vos choix sont appliqués côté serveur.'}</div>
    </div>
  );
};
