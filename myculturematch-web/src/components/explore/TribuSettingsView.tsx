import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Search, ShieldAlert, ShieldCheck, Settings, Lock, Unlock, Check, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';

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

export const TribuSettingsView: React.FC = () => {
  const [tribeName, setTribeName] = useState('t/MyFonHeritage');
  const [logoPreview, setLogoPreview] = useState<string>('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=150&q=80');
  const [bannerPreview, setBannerPreview] = useState<string>('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=820&h=360&q=80');
  const [searchMember, setSearchMember] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [memberToMute, setMemberToMute] = useState<Member | null>(null);
  const [permissionsMember, setPermissionsMember] = useState<Member | null>(null);

  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'Amal', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', role: 'Creator', joinedDate: '2 weeks ago' },
    { id: '2', name: 'Yuki', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', role: 'Moderator', joinedDate: '10 days ago' },
    { id: '3', name: 'Sofaia', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', role: 'Member', joinedDate: '5 days ago' },
    { id: '4', name: 'Chloe', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', role: 'Member', joinedDate: '3 days ago' },
    { id: '5', name: 'Caleb', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', role: 'Member', joinedDate: 'Yesterday' }
  ]);

  // Track muted members (who are forbidden from publishing)
  const [mutedMemberIds, setMutedMemberIds] = useState<string[]>([]);

  // Permissions state mapping memberId to permissions object
  const [memberPermissions, setMemberPermissions] = useState<Record<string, MemberPermissions>>({
    '2': { canDeletePosts: true, canEditNameEmblem: false, canEditBanner: false },
    '3': { canDeletePosts: false, canEditNameEmblem: false, canEditBanner: false },
    '4': { canDeletePosts: false, canEditNameEmblem: false, canEditBanner: false },
    '5': { canDeletePosts: false, canEditNameEmblem: false, canEditBanner: false },
  });

  // Current editing permissions inside the modal
  const [tempPermissions, setTempPermissions] = useState<MemberPermissions>({
    canDeletePosts: false,
    canEditNameEmblem: false,
    canEditBanner: false
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg(`Image size exceeds 2MB limit. Your image is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    setErrorMsg(null);
    const previewUrl = URL.createObjectURL(file);
    if (type === 'logo') {
      setLogoPreview(previewUrl);
    } else {
      setBannerPreview(previewUrl);
    }
  };

  const handleToggleMute = (member: Member) => {
    setMemberToMute(member);
  };

  const confirmToggleMute = () => {
    if (!memberToMute) return;
    const isCurrentlyMuted = mutedMemberIds.includes(memberToMute.id);
    if (isCurrentlyMuted) {
      setMutedMemberIds(prev => prev.filter(id => id !== memberToMute.id));
      setSuccessMsg(`${memberToMute.name} is now allowed to publish again.`);
    } else {
      setMutedMemberIds(prev => [...prev, memberToMute.id]);
      setSuccessMsg(`${memberToMute.name} has been forbidden from publishing in the tribe.`);
    }
    setMemberToMute(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleOpenPermissions = (member: Member) => {
    setPermissionsMember(member);
    setTempPermissions(
      memberPermissions[member.id] || {
        canDeletePosts: false,
        canEditNameEmblem: false,
        canEditBanner: false
      }
    );
  };

  const savePermissions = () => {
    if (!permissionsMember) return;
    setMemberPermissions(prev => ({
      ...prev,
      [permissionsMember.id]: tempPermissions
    }));
    setSuccessMsg(`Permissions updated for ${permissionsMember.name}.`);
    setPermissionsMember(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleModerator = (id: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        const newRole = m.role === 'Moderator' ? 'Member' : 'Moderator';
        // Auto-grant post deletion rights if promoted to moderator
        if (newRole === 'Moderator') {
          setMemberPermissions(p => ({
            ...p,
            [id]: { ...p[id], canDeletePosts: true }
          }));
        }
        return { ...m, role: newRole };
      }
      return m;
    }));
  };

  const handleSave = () => {
    setSuccessMsg('Tribe settings saved successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col gap-6 overflow-y-auto pb-12 pt-4 hide-scrollbar select-none text-app-black dark:text-zinc-300">
      {/* Settings Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="font-extrabold text-2xl text-app-black dark:text-white">Tribe Settings</h2>
          <p className="text-xs text-app-gray dark:text-zinc-400 font-semibold mt-1">Configure and manage your custom community</p>
        </div>
        <Button onClick={handleSave} className="bg-[#E27D60] text-white hover:bg-[#c66b50] font-black text-xs px-6 py-2 rounded-full shadow-sm cursor-pointer transition-all">
          Save Settings
        </Button>
      </div>

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

      {/* Banner Upload Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-app-border dark:border-zinc-800 overflow-hidden shadow-soft flex flex-col relative group">
        <div className="h-[200px] w-full bg-zinc-100 dark:bg-zinc-950 relative">
          <img src={bannerPreview} alt="Tribe Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <label className="flex items-center gap-2 px-4 py-2 bg-white/95 dark:bg-zinc-900/95 text-app-black dark:text-white rounded-full text-xs font-bold cursor-pointer hover:scale-105 transition-all">
              <Camera className="w-4 h-4" />
              <span>Change Banner</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'banner')} />
            </label>
          </div>
        </div>
        <div className="p-4 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-app-border dark:border-zinc-800">
          <p className="text-[10px] text-app-gray dark:text-zinc-500 font-extrabold uppercase tracking-wide">
            Banner Standard size: Facebook Standard (820 x 360 px) • Max 2MB
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form Settings */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-app-border dark:border-zinc-800 p-6 shadow-soft flex flex-col gap-5">
            <h3 className="font-extrabold text-sm text-app-black dark:text-white uppercase tracking-wider border-b border-app-border dark:border-zinc-800 pb-2">Tribe Profile</h3>
            
            {/* Logo Settings */}
            <div className="flex items-center gap-5">
              <div className="relative group/logo w-20 h-20 rounded-full overflow-hidden border-2 border-app-border dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
                <img src={logoPreview} alt="Tribe Logo" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                </label>
              </div>
              <div>
                <h4 className="font-bold text-sm text-app-black dark:text-white">Tribe Emblem</h4>
                <p className="text-[10px] text-app-gray dark:text-zinc-500 font-semibold mt-0.5">JPG or PNG • Recommended square • Max 2MB</p>
              </div>
            </div>

            {/* Name Setting */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500">Tribe Name</label>
              <input
                type="text"
                value={tribeName}
                onChange={(e) => setTribeName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-app-border dark:border-zinc-800 bg-transparent text-app-black dark:text-white font-semibold text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Members Management Column */}
        <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-app-border dark:border-zinc-800 p-5 shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-app-border dark:border-zinc-800 pb-2">
            <h3 className="font-extrabold text-sm text-app-black dark:text-white uppercase tracking-wider">Members ({members.length})</h3>
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
              const isMuted = mutedMemberIds.includes(member.id);
              const perms = memberPermissions[member.id] || { canDeletePosts: false, canEditNameEmblem: false, canEditBanner: false };
              
              return (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-100/30 dark:hover:bg-zinc-950/80 transition-all border border-transparent dark:border-zinc-900">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TotemAvatar src={member.avatar} alt={member.name} size="xs" glow="none" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-xs text-app-black dark:text-zinc-100 truncate">{member.name}</h5>
                        {isMuted && (
                          <span className="text-[8px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-1 rounded-sm font-black flex items-center gap-0.5">
                            <Lock className="w-2 h-2" /> Muted
                          </span>
                        )}
                      </div>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        member.role === 'Creator' 
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400' 
                          : member.role === 'Moderator' 
                          ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-400' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>

                  {member.role !== 'Creator' && (
                    <div className="flex items-center gap-0.5">
                      {/* Toggle Moderator Role */}
                      <button
                        onClick={() => handleToggleModerator(member.id)}
                        className={`p-1 rounded-md text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer border-none bg-transparent`}
                        title={member.role === 'Moderator' ? 'Demote to Member' : 'Promote to Moderator'}
                      >
                        🛡️
                      </button>

                      {/* Customize Member Permissions Gear */}
                      <button
                        onClick={() => handleOpenPermissions(member)}
                        className="p-1 rounded-md text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        title="Permissions Details"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>

                      {/* Forbid/Allow publishing lock button */}
                      <button
                        onClick={() => handleToggleMute(member)}
                        className={`p-1 rounded-md transition-all cursor-pointer border-none bg-transparent flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                          isMuted ? 'text-red-500' : 'text-app-gray hover:text-red-400'
                        }`}
                        title={isMuted ? 'Allow publishing' : 'Forbid publishing'}
                      >
                        {isMuted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <p className="text-center text-[10px] text-app-gray dark:text-zinc-500 py-6 font-semibold">No members found</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Muting/Forbidding Publishing */}
      {memberToMute && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-[28px] max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 animate-fade-in select-none text-app-black dark:text-zinc-100">
            <h3 className="font-extrabold text-base text-app-black dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" />
              <span>Forbid Publishing?</span>
            </h3>
            <p className="text-xs text-app-gray dark:text-zinc-400 font-semibold leading-relaxed">
              Are you sure you want to forbid <strong>{memberToMute.name}</strong> from publishing new posts/traditions in <strong>{tribeName}</strong>? They will remain in the tribe but won't be allowed to post.
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
                onClick={confirmToggleMute}
                className="flex-1 py-2 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer border-none"
              >
                Yes, Forbid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Permissions Modal */}
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
              {/* Permission Item 1 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tempPermissions.canDeletePosts}
                  onChange={(e) => setTempPermissions(prev => ({ ...prev, canDeletePosts: e.target.checked }))}
                  className="mt-0.5 rounded border-app-border dark:border-zinc-800 text-[#E27D60] focus:ring-[#E27D60] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-300 group-hover:text-[#E27D60] transition-colors">
                    Can delete tribe posts
                  </span>
                  <p className="text-[10px] text-app-gray dark:text-zinc-500 font-semibold mt-0.5">Allows the user to moderate content by removing published posts</p>
                </div>
              </label>

              {/* Permission Item 2 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tempPermissions.canEditNameEmblem}
                  onChange={(e) => setTempPermissions(prev => ({ ...prev, canEditNameEmblem: e.target.checked }))}
                  className="mt-0.5 rounded border-app-border dark:border-zinc-800 text-[#E27D60] focus:ring-[#E27D60] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-300 group-hover:text-[#E27D60] transition-colors">
                    Can edit tribe name & emblem logo
                  </span>
                  <p className="text-[10px] text-app-gray dark:text-zinc-500 font-semibold mt-0.5">Allows modifying the name or profile photo of the community</p>
                </div>
              </label>

              {/* Permission Item 3 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={tempPermissions.canEditBanner}
                  onChange={(e) => setTempPermissions(prev => ({ ...prev, canEditBanner: e.target.checked }))}
                  className="mt-0.5 rounded border-app-border dark:border-zinc-800 text-[#E27D60] focus:ring-[#E27D60] w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-300 group-hover:text-[#E27D60] transition-colors">
                    Can edit tribe background banner
                  </span>
                  <p className="text-[10px] text-app-gray dark:text-zinc-500 font-semibold mt-0.5">Allows uploading new background covers for the community page</p>
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
