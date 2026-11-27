import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isOwner, type TribeVisibility } from '@/src/lib/tribeAccess';
import { Camera, Image as ImageIcon, Search, ShieldAlert, ShieldCheck, Settings, Lock, Unlock, Check, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { tribuService } from '@/src/services/tribuService';
import { useAppStore } from '@/src/stores/useAppStore';

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'Creator' | 'Moderator' | 'Member';
  joinedDate: string;
}

interface MemberPermissions {
  canDeletePosts: boolean;
  canEditNameEmblem: boolean;
  canEditBanner: boolean;
}

/**
 * Réglages de la tribu sélectionnée : infos réelles via /api/tribes/:id.
 * Les membres/modérateurs viennent de l'API (role owner/moderator/member).
 */
export const TribuSettingsView: React.FC = () => {
  const selectedTribeId = useAppStore((s) => s.selectedTribeId);
  const [searchMember, setSearchMember] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: tribeInfo } = useQuery({
    queryKey: ['tribu-info', selectedTribeId],
    queryFn: () => tribuService.fetchTribeInfo(selectedTribeId ?? undefined),
    enabled: !!selectedTribeId,
  });

  const { data: moderators = [] } = useQuery({
    queryKey: ['tribu-moderators', selectedTribeId],
    queryFn: () => tribuService.fetchModerators(selectedTribeId ?? undefined),
    enabled: !!selectedTribeId,
  });

  const queryClient = useQueryClient();
  const visibilityMutation = useMutation({
    mutationFn: (visibility: TribeVisibility) => tribuService.setVisibility(selectedTribeId as string, visibility),
    onSuccess: async (_r, visibility) => {
      setErrorMsg(null);
      setSuccessMsg(visibility === 'private' ? 'La tribu est maintenant privée.' : 'La tribu est maintenant publique.');
      setTimeout(() => setSuccessMsg(null), 3000);
      for (const queryKey of [['tribu-info', selectedTribeId], ['tribu-posts', selectedTribeId], ['tribu-join-requests', selectedTribeId], ['explore'], ['my-tribes']]) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (err) => {
      setSuccessMsg(null);
      setErrorMsg(err instanceof Error && err.message ? err.message : 'Modification de la visibilité impossible');
    },
  });

  const tribeName = tribeInfo?.name ? `t/${tribeInfo.name}` : 'Tribu';

  // Modals
  const [memberToMute, setMemberToMute] = useState<Member | null>(null);
  const [permissionsMember, setPermissionsMember] = useState<Member | null>(null);

  // Permissions (à relier aux endpoints backend dédiés lorsqu'ils existeront)
  const [memberPermissions, setMemberPermissions] = useState<Record<string, MemberPermissions>>({});
  const [tempPermissions, setTempPermissions] = useState<MemberPermissions>({
    canDeletePosts: false,
    canEditNameEmblem: false,
    canEditBanner: false,
  });

  const members: Member[] = moderators.map((mod) => ({
    id: mod.name, // l'API modérateurs renvoie userId+role+name
    name: mod.name,
    avatar: (mod as { avatar?: string }).avatar ?? '',
    role: mod.role === 'owner' ? 'Creator' : 'Moderator',
    joinedDate: '',
  }));

  const handleToggleMute = (member: Member) => setMemberToMute(member);

  const handleOpenPermissions = (member: Member) => {
    setPermissionsMember(member);
    setTempPermissions(memberPermissions[member.id] ?? { canDeletePosts: false, canEditNameEmblem: false, canEditBanner: false });
  };

  const savePermissions = () => {
    if (!permissionsMember) return;
    setMemberPermissions((prev) => ({ ...prev, [permissionsMember.id]: tempPermissions }));
    setSuccessMsg(`Permissions updated for ${permissionsMember.name}.`);
    setPermissionsMember(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col gap-6 overflow-y-auto pb-12 pt-4 hide-scrollbar select-none text-app-black dark:text-zinc-300">
      {/* Settings Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="font-extrabold text-2xl text-app-black dark:text-white">Tribe Settings</h2>
          <p className="text-xs text-app-gray dark:text-zinc-400 font-semibold mt-1">
            {tribeName} — {tribeInfo?.membersCount ?? 0} membres
          </p>
        </div>
      </div>

      {!selectedTribeId && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 text-amber-700 dark:text-amber-400 text-xs font-bold">
          Sélectionnez d'abord une tribu depuis l'onglet Tribu.
        </div>
      )}

      {/* Alerts */}
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400 text-xs font-bold animate-fade-in">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-2xl p-4 flex items-center gap-3 text-green-700 dark:text-green-400 text-xs font-bold animate-fade-in">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Tribe Profile Card */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-app-border dark:border-zinc-800 p-6 shadow-soft flex flex-col gap-5">
            <h3 className="font-extrabold text-sm text-app-black dark:text-white uppercase tracking-wider border-b border-app-border dark:border-zinc-800 pb-2">Tribe Profile</h3>

            {/* Logo */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-app-border dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
                {tribeInfo ? (
                  <TotemAvatar alt={`${tribeInfo.name} Tribe Logo`} size="lg" glow="turquoise" shape="hexagon" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-app-gray" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-app-black dark:text-white">Tribe Emblem</h4>
                <p className="text-[10px] text-app-gray dark:text-zinc-500 font-semibold mt-0.5">Modifiable par le créateur de la tribu</p>
              </div>
            </div>

            {/* Name (lecture seule ici — modification via PATCH /api/tribes/:id par l'owner) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500">Tribe Name</label>
              <input
                type="text"
                value={tribeName}
                readOnly
                className="w-full px-4 py-3 rounded-2xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-app-black dark:text-white font-semibold text-sm focus:outline-none cursor-not-allowed"
              />
            </div>

            {tribeInfo?.description && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500">Description</label>
                <p className="text-xs text-app-gray dark:text-zinc-400">{tribeInfo.description}</p>
              </div>
            )}
          </div>

          {/* Visibilité : modifiable par l'administrateur uniquement */}
          {tribeInfo && (
            <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-app-border dark:border-zinc-800 p-6 shadow-soft flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-app-black dark:text-white uppercase tracking-wider border-b border-app-border dark:border-zinc-800 pb-2">
                Visibilité
              </h3>
              <div role="radiogroup" aria-label="Visibilité de la tribu" className="flex flex-col gap-2.5">
                {(['public', 'private'] as const).map((v) => {
                  const current = tribeInfo.visibility ?? 'public';
                  const selected = current === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!isOwner(tribeInfo.role) || visibilityMutation.isPending}
                      onClick={() => !selected && visibilityMutation.mutate(v)}
                      className={`text-left p-3.5 rounded-2xl border transition-all disabled:cursor-not-allowed ${
                        selected
                          ? 'bg-[#E27D60]/5 border-[#E27D60] dark:bg-[#E27D60]/10'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 enabled:hover:bg-zinc-100/50 enabled:cursor-pointer'
                      }`}
                    >
                      <span className="font-extrabold text-xs text-app-black dark:text-white block">
                        {v === 'public' ? 'Publique' : 'Privée'}
                      </span>
                      <span className="text-[10px] text-app-gray dark:text-zinc-400 font-medium block mt-0.5">
                        {v === 'public'
                          ? 'Tout le monde peut voir le contenu et rejoindre la tribu.'
                          : 'Le contenu est réservé aux membres ; les adhésions passent par une demande approuvée par un modérateur.'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!isOwner(tribeInfo.role) && (
                <p className="text-[10px] text-app-gray dark:text-zinc-500 font-semibold">
                  Seul l’administrateur de la tribu peut modifier sa visibilité.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Members Management Column */}
        <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-app-border dark:border-zinc-800 p-5 shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-app-border dark:border-zinc-800 pb-2">
            <h3 className="font-extrabold text-sm text-app-black dark:text-white uppercase tracking-wider">Staff ({members.length})</h3>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-app-gray absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Search member..."
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-app-border dark:border-zinc-800 bg-transparent text-app-black dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Members list */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px] pr-1 hide-scrollbar">
            {filteredMembers.map((member) => {
              const perms = memberPermissions[member.id] || { canDeletePosts: false, canEditNameEmblem: false, canEditBanner: false };
              void perms;

              return (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-100/30 dark:hover:bg-zinc-950/80 transition-all border border-transparent dark:border-zinc-900">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TotemAvatar src={member.avatar} alt={member.name} size="xs" glow="none" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-xs text-app-black dark:text-zinc-100 truncate">{member.name}</h5>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        member.role === 'Creator'
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                          : 'bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-400'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>

                  {member.role !== 'Creator' && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleOpenPermissions(member)}
                        className="p-1 rounded-md text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        title="Permissions Details"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleMute(member)}
                        className="p-1 rounded-md transition-all cursor-pointer border-none bg-transparent flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-app-gray hover:text-red-400"
                        title="Forbid publishing"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <p className="text-center text-[10px] text-app-gray dark:text-zinc-500 py-6 font-semibold">
                {selectedTribeId ? 'No staff found' : 'Aucune tribu sélectionnée'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {memberToMute && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-[28px] max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 animate-fade-in select-none text-app-black dark:text-zinc-100">
            <h3 className="font-extrabold text-base text-app-black dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" />
              <span>Forbid Publishing?</span>
            </h3>
            <p className="text-xs text-app-gray dark:text-zinc-400 font-semibold leading-relaxed">
              La gestion des permissions de publication (mute) sera appliquée via l'API tribu.
              Cette confirmation est visuelle pour l'instant.
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setMemberToMute(null)}
                className="flex-1 py-2 text-xs font-black rounded-xl border border-app-border dark:border-zinc-800 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => setMemberToMute(null)}
                className="flex-1 py-2 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer border-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permissionsMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-[28px] max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 animate-fade-in select-none text-app-black dark:text-zinc-100">
            <div className="flex items-center justify-between border-b border-app-border dark:border-zinc-800 pb-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-app-black dark:text-white">
                Permissions: {permissionsMember.name}
              </h3>
              <button
                onClick={() => setPermissionsMember(null)}
                className="text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer bg-transparent border-none p-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tempPermissions.canDeletePosts}
                  onChange={(e) => setTempPermissions((prev) => ({ ...prev, canDeletePosts: e.target.checked }))}
                  className="mt-0.5 rounded border-app-border dark:border-zinc-800 text-[#E27D60] focus:ring-[#E27D60] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-300 group-hover:text-[#E27D60] transition-colors">
                    Can delete tribe posts
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tempPermissions.canEditNameEmblem}
                  onChange={(e) => setTempPermissions((prev) => ({ ...prev, canEditNameEmblem: e.target.checked }))}
                  className="mt-0.5 rounded border-app-border dark:border-zinc-800 text-[#E27D60] focus:ring-[#E27D60] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-300 group-hover:text-[#E27D60] transition-colors">
                    Can edit tribe name & emblem logo
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tempPermissions.canEditBanner}
                  onChange={(e) => setTempPermissions((prev) => ({ ...prev, canEditBanner: e.target.checked }))}
                  className="mt-0.5 rounded border-app-border dark:border-zinc-800 text-[#E27D60] focus:ring-[#E27D60] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-300 group-hover:text-[#E27D60] transition-colors">
                    Can edit tribe background banner
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPermissionsMember(null)}
                className="flex-1 py-2 text-xs font-black rounded-xl border border-app-border dark:border-zinc-800 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={savePermissions}
                className="flex-1 py-2 text-xs font-black bg-[#E27D60] hover:bg-[#c66b50] text-white rounded-xl cursor-pointer border-none"
              >
                Apply Rights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
