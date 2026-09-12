import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, Calendar, Pencil, Languages, Sparkles } from 'lucide-react';
import { ProfileEditModal } from '../ProfileEditModal';
import { useAppStore } from '@/src/stores/useAppStore';
import { resolveCountryFlag } from '@/src/components/ui/TotemAvatar';

interface AboutTabProps {
  user: any;
  getCityAndCountry: (location: string) => { city: string; country: string };
}

/**
 * Onglet "À propos" — lecture seule. Tout se modifie via le popup unique
 * "Modifier le profil" (bouton Modifier, comme sur Instagram).
 */
export const AboutTab: React.FC<AboutTabProps> = ({ user, getCityAndCountry }) => {
  const [showEdit, setShowEdit] = useState(false);
  const currentUser = useAppStore((s) => s.currentUser);
  const isOwn = user.id === currentUser.id;

  const city = user.location?.split(',')[0]?.trim() || getCityAndCountry(user.location || '').city || '—';
  const country = user.country || getCityAndCountry(user.location || '').country || '—';
  const originFlag = resolveCountryFlag(user.country || user.location);
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const languages = Array.isArray(user.languages) ? user.languages.join(', ') : user.languages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* Bio description */}
      <div className="lg:col-span-6 bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#2e3552] dark:text-white text-lg">About Me</h3>
          {isOwn && (
            <button
              onClick={() => setShowEdit(true)}
              className="text-xs font-bold text-[#6c63fc] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier le profil
            </button>
          )}
        </div>
        <p className="text-sm text-[#9aa3b8] leading-relaxed">
          {user.bio || "Cet utilisateur n'a pas encore rédigé sa bio. Les traditions, racines et intentions apparaîtront ici."}
        </p>
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 flex gap-4 text-xs font-bold text-[#9aa3b8] mt-2">
          <div className="flex flex-col">
            <span className="text-[#2e3552] dark:text-white text-sm font-black">{user.traditionsCount || 0}</span>
            <span>Traditions</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-100 dark:bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[#2e3552] dark:text-white text-sm font-black">{user.interestedCount || 0}</span>
            <span>Interested</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-100 dark:bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[#2e3552] dark:text-white text-sm font-black">{user.companionsCount || 0}</span>
            <span>Companions</span>
          </div>
        </div>
      </div>

      {/* Racines & Héritage */}
      <div className="lg:col-span-6 bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Racines &amp; Héritage</h3>
          {isOwn && (
            <button
              onClick={() => setShowEdit(true)}
              className="text-xs font-bold text-[#6c63fc] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
          )}
        </div>
        <p className="text-[11px] text-app-gray -mt-2">
          Vos origines et traditions culturelles, telles que partagées avec la communauté.
        </p>
        <div className="flex flex-col gap-4 mt-1">
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-[#9aa3b8] flex items-center gap-2">🌍 Pays d'origine</span>
            <span className="font-black text-[#2e3552] dark:text-white flex items-center gap-1.5">
              {originFlag && <span className="text-base leading-none">{originFlag}</span>}
              {country}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-[#9aa3b8] flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> Région</span>
            <span className="font-black text-[#2e3552] dark:text-white">{user.region || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-[#9aa3b8] flex items-center gap-2"><Languages className="w-4 h-4 text-sky-500" /> Langues</span>
            <span className="font-black text-[#2e3552] dark:text-white">{languages || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-[#9aa3b8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Héritage culturel</span>
            <span className="font-black text-[#2e3552] dark:text-white text-right max-w-[55%]">{user.heritage || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-[#9aa3b8]">Origines</span>
            <span className="font-black text-[#2e3552] dark:text-white">{user.ethnicity || country}</span>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="lg:col-span-12 bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Personal Details</h3>
          {isOwn && (
            <button
              onClick={() => setShowEdit(true)}
              className="text-xs font-bold text-[#6c63fc] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-1">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9aa3b8] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" /> City
            </span>
            <span className="font-black text-[#2e3552] dark:text-white">{city}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9aa3b8] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#E27D60]" /> Country
            </span>
            <span className="font-black text-[#2e3552] dark:text-white">{country}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9aa3b8] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-green-500" /> Joined
            </span>
            <span className="font-black text-[#2e3552] dark:text-white">{joinedDate ?? '—'}</span>
          </div>
        </div>
      </div>

      {showEdit && <ProfileEditModal user={user} onClose={() => setShowEdit(false)} />}
    </motion.div>
  );
};
