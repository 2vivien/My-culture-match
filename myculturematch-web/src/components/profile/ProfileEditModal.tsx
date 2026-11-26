import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { userService } from '@/src/services/userService';
import { DOMAINS } from '@/src/services/onboarding.service';
import { useAppStore } from '@/src/stores/useAppStore';
import { resolveCountryFlag } from '@/src/components/ui/ProfileAvatar';

interface ProfileEditModalProps {
  user: any;
  onClose: () => void;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-white text-sm font-semibold focus:outline-none focus:border-[#6c63fc] transition-colors';

const labelClass = 'text-xs font-black uppercase tracking-wider text-app-gray';

/**
 * Popup "Modifier le profil" à la Instagram :
 * — colonne gauche : identité (avatar, nom public, bio) + stats ;
 * — colonne droite : détails — Racines & Héritage (pays d'origine, région,
 *   langues, héritage), About Me, Personal Details (ville, pays, âge).
 * Un seul popup pour tout modifier — plus de carte About éditable séparément.
 */
export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, onClose }) => {
  const { loginUser } = useAppStore();
  const [name, setName] = useState(user.name ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [city, setCity] = useState((user.location ?? '').split(',')[0]?.trim() ?? '');
  const [country, setCountry] = useState(user.country ?? '');
  const [region, setRegion] = useState(user.region ?? '');
  const [languages, setLanguages] = useState(
    Array.isArray(user.languages) ? user.languages.join(', ') : (user.languages ?? ''),
  );
  const [heritage, setHeritage] = useState(user.heritage ?? '');
  const [ethnicity, setEthnicity] = useState(user.ethnicity ?? '');
  const [occupationDomain, setOccupationDomain] = useState(user.occupation?.domain ?? '');
  const [occupationTitle, setOccupationTitle] = useState(user.occupation?.title ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const originFlag = resolveCountryFlag(user.country || user.location);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = {};
      if (name.trim() && name.trim() !== user.name) patch.name = name.trim();
      if (bio.trim() && bio.trim().length >= 10) patch.bio = bio.trim();
      if (city.trim() || country.trim()) patch.location = [city.trim(), country.trim()].filter(Boolean).join(', ');
      if (country.trim() && country.trim() !== user.country) patch.country = country.trim();
      if (region.trim() && region.trim() !== (user.region ?? '')) patch.region = region.trim();
      const langList = languages.split(',').map((l: string) => l.trim()).filter(Boolean);
      if (langList.length > 0) patch.languages = langList;
      if (heritage.trim() && heritage.trim() !== (user.heritage ?? '')) patch.heritage = heritage.trim();
      if (ethnicity.trim() && ethnicity.trim() !== (user.ethnicity ?? '')) patch.ethnicity = ethnicity.trim();
      if (occupationDomain.trim() && occupationTitle.trim()) {
        patch.occupation = { domain: occupationDomain.trim(), title: occupationTitle.trim() };
      }

      if (Object.keys(patch).length === 0) {
        onClose();
        return;
      }

      const updated = await userService.updateProfile(patch);
      loginUser({
        name: updated.name,
        username: updated.username,
        avatar: updated.avatar ?? undefined,
        location: updated.location ?? '',
        country: updated.country ?? '',
      });
      setSaved(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        className="bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-[28px] max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-fade-in select-none text-app-black dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border dark:border-zinc-800 shrink-0">
          <h3 className="font-extrabold text-lg text-app-black dark:text-white">Modifier le profil</h3>
          <button
            onClick={onClose}
            className="text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer bg-transparent border-none p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps : gauche identité / droite détails — bien séparés */}
        <div className="overflow-y-auto grow">
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-app-border/60 dark:divide-zinc-800">
            {/* ── Colonne gauche : identité ── */}
            <div className="p-6 flex flex-col gap-4">
              {/* Avatar + nom (lecture seule comme Instagram) */}
              <div className="flex items-center gap-3 pb-4 border-b border-app-border/60 dark:border-zinc-800">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover border border-app-border dark:border-zinc-700"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="font-black text-base text-app-black dark:text-white truncate">{user.username || user.name}</p>
                  <p className="text-sm text-app-gray truncate">{user.name}{originFlag ? ` · ${originFlag}` : ''}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Nom public</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Bio / About Me</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`${inputClass} h-28 resize-none`}
                  placeholder="Parlez de vos racines, vos posts, ce que vous cherchez ici…"
                />
              </div>

              {/* Stats (lecture seule) */}
              <div className="flex gap-5 pt-2 mt-auto">
                <div className="flex flex-col">
                  <span className="text-base font-black text-[#2e3552] dark:text-white">{user.postsCount || 0}</span>
                  <span className="text-xs font-bold text-app-gray">Posts</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black text-[#2e3552] dark:text-white">{user.interestedCount || 0}</span>
                  <span className="text-xs font-bold text-app-gray">Interested</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black text-[#2e3552] dark:text-white">{user.companionsCount || 0}</span>
                  <span className="text-xs font-bold text-app-gray">Companions</span>
                </div>
              </div>
            </div>

            {/* ── Colonne droite : détails ── */}
            <div className="p-6 flex flex-col gap-4">
              {/* Racines & Héritage */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-black text-app-black dark:text-white">Racines &amp; Héritage</p>
                <p className="text-xs text-app-gray -mt-2">
                  Vos origines et posts culturelles, telles que partagées avec la communauté.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Pays d'origine</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={inputClass}
                      placeholder="Ex: Bénin"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Région</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className={inputClass}
                      placeholder={user.region ? `Actuel : ${user.region}` : 'Ex: Atlantique'}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Langues (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className={inputClass}
                    placeholder="Ex: Fon, Français, Anglais"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Héritage culturel</label>
                  <input
                    type="text"
                    value={heritage}
                    onChange={(e) => setHeritage(e.target.value)}
                    className={inputClass}
                    placeholder={user.heritage ? `Actuel : ${user.heritage}` : "Ex: Danses posts, cuisine ancestrale…"}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Ethnie d'origine</label>
                  <input
                    type="text"
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className={inputClass}
                    placeholder={user.ethnicity ? `Actuel : ${user.ethnicity}` : 'Ex: Fon, Yoruba, Baoulé…'}
                  />
                </div>
              </div>

              {/* Personal Details */}
              <div className="flex flex-col gap-3 pt-2 border-t border-app-border/60 dark:border-zinc-800">
                <p className="text-sm font-black text-app-black dark:text-white pt-2">Personal Details</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Ville</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                      placeholder="Ex: Cotonou"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Pays</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={inputClass}
                      placeholder="BJ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Domaine</label>
                    <select
                      value={occupationDomain}
                      onChange={(e) => setOccupationDomain(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Choisir…</option>
                      {DOMAINS.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Titre / Métier</label>
                    <input
                      type="text"
                      value={occupationTitle}
                      onChange={(e) => setOccupationTitle(e.target.value)}
                      className={inputClass}
                      placeholder="Ex: Développeur"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-app-border dark:border-zinc-800 flex items-center gap-3 shrink-0">
          {error && <p className="text-xs font-bold text-red-500 flex-1" role="alert">{error}</p>}
          <div className="flex gap-3 flex-1 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-black rounded-xl border border-app-border dark:border-zinc-800 text-app-gray hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 text-sm font-black bg-[#6c63fc] hover:bg-[#5a52e0] disabled:opacity-60 text-white rounded-xl cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {saving ? 'Sauvegarde…' : saved ? 'Enregistré !' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
