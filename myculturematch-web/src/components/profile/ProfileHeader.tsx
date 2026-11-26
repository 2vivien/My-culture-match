import React, { useRef, useState } from 'react';
import { Cable, RadioTower, Unplug, Pencil } from 'lucide-react';
import { SandboxIcon } from '@/src/components/ui/SandboxIcon';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { useAppStore } from '@/src/stores/useAppStore';
import { ProfileEditModal } from './ProfileEditModal';

interface ProfileHeaderProps {
  user: any;
  connectionState: 'none' | 'pending' | 'connected';
  onToggleConnection: () => void;
  onSendMessage: () => void;
  getCountryCode: (location: string) => string;
}

/**
 * Header du profil — sans bannière : avatar centré, stats à gauche,
 * nom au centre, actions à droite. Le bouton "Modifier le profil" ouvre un
 * popup à la Instagram (une seule colonne gauche = identité, droite = détails).
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  connectionState,
  onToggleConnection,
  onSendMessage,
  getCountryCode: _getCountryCode,
}) => {
  const { currentUser } = useAppStore();
  const [showEdit, setShowEdit] = useState(false);
  const isOwn = user.id === currentUser.id;

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-[24px] shadow-sm flex flex-col relative mt-2">
      {/* Avatar centré (plus de bannière, plus de changement de photo ici) */}
      <div className="pt-8 flex justify-center">
        <ProfileAvatar
          size="xl"
          src={user.avatar}
          alt={user.name}
          countryFlag={user.country || user.location}
          level={user.level}
          glow="none"
          className="drop-shadow-xl"
          shape="cloud"
        />
      </div>

      {/* Contenu sous l'avatar */}
      <div className="pt-5 pb-8 px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center text-center lg:text-left">
        {/* Ligne de statistiques à gauche (avec drapeau du pays) */}
        <div className="flex justify-center lg:justify-start items-center gap-6 order-2 lg:order-1">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#2e3552] dark:text-white">{user.postsCount || 0}</span>
            <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#2e3552] dark:text-white">{user.interestedCount || 0}</span>
            <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Interested</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#2e3552] dark:text-white">{user.companionsCount || 0}</span>
            <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Companions</span>
          </div>
        </div>

        {/* Centre : Nom et Handle (sans @, comme sur Instagram) */}
        <div className="flex flex-col items-center justify-center order-1 lg:order-2">
          <h1 className="text-3xl font-black text-[#2e3552] dark:text-white">{user.name}</h1>
          <span className="text-[#2dd9d9] font-bold text-sm mt-1">{user.username || user.name?.toLowerCase()}</span>
        </div>

        {/* Droite : Boutons d'icônes */}
        <div className="flex flex-col items-center lg:items-end gap-4 order-3 lg:order-3">
          <div className="flex gap-3">
            {!isOwn && (
              <button
                type="button"
                onClick={onToggleConnection}
                className={`w-12 h-12 rounded-xl text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-md cursor-pointer ${
                  connectionState === 'connected' ? 'bg-[#2dd9d9]/20 text-[#2dd9d9]' :
                  connectionState === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-[#E27D60] dark:bg-[#c66b50]'
                }`}
                title="Connect"
              >
                {connectionState === 'connected' ? <Cable className="w-5 h-5" /> :
                 connectionState === 'pending' ? <RadioTower className="w-5 h-5" /> :
                 <Unplug className="w-5 h-5" />}
              </button>
            )}
            {!isOwn && (
              <button
                type="button"
                onClick={onSendMessage}
                className="w-12 h-12 rounded-xl flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-md cursor-pointer bg-white dark:bg-zinc-800 border border-app-border dark:border-zinc-700 text-app-black dark:text-zinc-100"
                title="Send Message"
              >
                <SandboxIcon className="w-5 h-5 text-app-black dark:text-zinc-100" />
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="h-12 px-5 rounded-xl flex items-center gap-2 hover:opacity-90 hover:scale-105 transition-all shadow-md cursor-pointer bg-white dark:bg-zinc-800 border border-app-border dark:border-zinc-700 text-app-black dark:text-zinc-100"
                title="Modifier le profil"
              >
                <Pencil className="w-4 h-4" />
                <span className="text-xs font-black">Modifier le profil</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'édition du profil (popup unique à la Instagram) */}
      {showEdit && <ProfileEditModal user={user} onClose={() => setShowEdit(false)} />}
    </div>
  );
};
