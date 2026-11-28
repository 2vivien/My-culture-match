import React, { useEffect, useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { userService } from '@/src/services/userService';
import { useAppStore } from '@/src/stores/useAppStore';

/**
 * Section Profile des Settings : nom public + bio, reliés à PATCH /api/users/me.
 */
export const ProfileSection: React.FC = () => {
  const currentUser = useAppStore((s) => s.currentUser);
  const loginUser = useAppStore((s) => s.loginUser);
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState('');
  const [bioLoaded, setBioLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charge la bio existante depuis le profil réel
  useEffect(() => {
    let cancelled = false;
    userService
      .fetchCurrentUser()
      .then((me) => {
        if (cancelled) return;
        setBio(me.bio ?? '');
        setBioLoaded(true);
      })
      .catch(() => setBioLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = {};
      if (name.trim() && name.trim() !== currentUser.name) patch.name = name.trim();
      if (bio.trim()) {
        if (bio.trim().length < 10) {
          setError('La bio doit contenir au moins 10 caractères.');
          setSaving(false);
          return;
        }
        patch.bio = bio.trim();
      }
      if (Object.keys(patch).length === 0) return;

      const updated = await userService.updateProfile(patch);
      loginUser({ name: updated.name, username: updated.username });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-sm uppercase font-extrabold tracking-wider text-app-gray dark:text-zinc-500 mb-4">
          Public Profile
        </h2>
        <div className="divide-y divide-app-border/40 dark:divide-zinc-800/40">
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-sm font-extrabold text-app-black dark:text-zinc-400">Display Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3.5 py-2 text-sm rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 focus:outline-none focus:border-zinc-400 w-64"
            />
          </div>
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
            <span className="text-sm font-extrabold text-app-black dark:text-zinc-400">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={bioLoaded ? 'Votre bio (min. 10 caractères)…' : 'Chargement…'}
              className="px-3.5 py-2 text-sm rounded-xl border border-app-border bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 focus:outline-none focus:border-zinc-400 resize-none h-16 w-64"
            />
          </div>
          <div className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-sm font-extrabold text-app-black dark:text-zinc-400">Username</span>
            <span className="text-xs font-bold text-app-gray dark:text-zinc-500">{currentUser.username}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-xs font-bold text-red-500" role="alert">{error}</p>}

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 disabled:opacity-60 text-white rounded-full px-6 py-2 text-xs font-black cursor-pointer flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
          {saving ? 'Sauvegarde…' : saved ? 'Enregistré !' : 'Save Profile Changes'}
        </button>
      </div>
    </div>
  );
};
