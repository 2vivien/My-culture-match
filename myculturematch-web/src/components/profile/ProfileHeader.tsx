import React, { useState } from 'react';
import { Plus, Menu, UserPlus, Check, Pencil } from 'lucide-react';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { ProfileEditModal } from './ProfileEditModal';

interface ProfileHeaderProps {
  user: any;
  connectionState: 'none' | 'pending' | 'connected';
  onToggleConnection: () => void;
  onSendMessage: () => void;
  getCountryCode: (location: string) => string;
}

const greyButton =
  'px-5 py-2.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer active:scale-[0.98]';

/**
 * Profil façon Instagram : identité en haut, avatar à gauche, stats à droite,
 * bio pleine largeur, puis deux actions grises. Pas de story circles en bas.
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  connectionState,
  onToggleConnection,
  onSendMessage,
  getCountryCode: _getCountryCode,
}) => {
  const { currentUser } = useAppStore();
  const { setActiveTab, notificationsCount } = useUIStore();
  const [showEdit, setShowEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const isOwn = user.id === currentUser.id;

  const shareProfile = async () => {
    const url = `${window.location.origin}/profil/${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const stats = [
    { label: 'Posts', value: user.postsCount ?? 0 },
    { label: 'Followers', value: user.followersCount ?? user.companionsCount ?? 0 },
    { label: 'Following', value: user.followingCount ?? user.interestedCount ?? 0 },
  ];

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 px-5 py-5">
      {/* Ligne supérieure : username + actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-black text-app-black dark:text-zinc-100 truncate">
            {user.username || user.name}
          </h1>
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <button
            onClick={() => setActiveTab('Create')}
            title="Create a post"
            className="cursor-pointer text-app-black dark:text-zinc-100 hover:text-zinc-500"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveTab('Notifications')}
            title="Notifications"
            className="relative cursor-pointer text-app-black dark:text-zinc-100 hover:text-zinc-500"
          >
            <Menu className="w-6 h-6" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {notificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Avatar + statistiques */}
      <div className="flex items-center gap-6 md:gap-12">
        <ProfileAvatar
          size="xl"
          shape="circle"
          src={user.avatar}
          alt={user.name}
          glow="none"
          countryFlag={user.country || user.location}
        />
        <div className="flex-1 grid grid-cols-3 gap-3 text-center md:text-left">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-lg font-black text-app-black dark:text-zinc-100">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="mt-5 text-sm text-app-black dark:text-zinc-100 space-y-0.5">
        <p className="font-bold">{user.name}</p>
        {user.bio && <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">{user.bio}</p>}
        {(user.location || user.country) && (
          <p className="text-zinc-500 text-xs">📍 {[user.location, user.country].filter(Boolean).join(' · ')}</p>
        )}
        {Array.isArray(user.languages) && user.languages.length > 0 && (
          <p className="text-zinc-500 text-xs">{user.languages.join(' · ')}</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2">
        {isOwn ? (
          <>
            <button onClick={() => setShowEdit(true)} className={`${greyButton} flex-1 flex items-center justify-center gap-2`}>
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
            <button onClick={shareProfile} className={`${greyButton} flex-1 flex items-center justify-center gap-2`}>
              {copied ? <Check className="w-4 h-4" /> : null}
              {copied ? 'Copied!' : 'Share Profile'}
            </button>
            <button
              onClick={() => setActiveTab('Friends')}
              title="Find people"
              className="w-11 h-11 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <UserPlus className="w-4.5 h-4.5 text-zinc-700 dark:text-zinc-200" />
            </button>
          </>
        ) : (
          <>
            <button onClick={onToggleConnection} className={`${greyButton} flex-1`}>
              {connectionState === 'connected' ? 'Connected' : connectionState === 'pending' ? 'Requested' : 'Connect'}
            </button>
            <button onClick={onSendMessage} className={`${greyButton} flex-1`}>
              Message
            </button>
          </>
        )}
      </div>

      {showEdit && <ProfileEditModal user={user} onClose={() => setShowEdit(false)} />}
    </div>
  );
};
