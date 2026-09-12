import React, { useState } from 'react';
import { Search, Ban, CheckCircle, MoreHorizontal, X, Shield, Mail, MapPin, Calendar } from 'lucide-react';
import { useAdminUsers, useBanUser, useUnbanUser } from '@/src/hooks/useAdmin';
import type { AdminUser } from '@/src/services/adminService';
import { cn } from '@/src/lib/utils';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const [banReason, setBanReason] = useState('');

  const isBanned = !!user.bannedAt;
  const isSuspended = !!user.lockedUntil && new Date(user.lockedUntil) > new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-app-border dark:border-zinc-800 w-full max-w-lg mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-app-black dark:text-white">{user.name}</h3>
              <p className="text-xs text-app-gray dark:text-zinc-500">{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer bg-transparent border-none">
            <X className="w-4 h-4 text-app-gray dark:text-zinc-400" />
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Shield} label="Rôle" value={user.role} />
            <InfoRow icon={Calendar} label="Inscrit" value={timeAgo(user.createdAt)} />
            <InfoRow icon={MapPin} label="Profil" value={user.profileCompleted ? 'Complet' : 'Incomplet'} />
          </div>

          {isBanned && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <p className="text-xs font-bold text-red-700 dark:text-red-400">Banni</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{user.banReason ?? 'Sans raison'}</p>
            </div>
          )}
          {isSuspended && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Suspendu</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Jusqu'au {new Date(user.lockedUntil!).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-app-border dark:border-zinc-800 flex items-center gap-3">
          {isBanned ? (
            <button
              onClick={() => unbanMutation.mutate({ userId: user.id })}
              disabled={unbanMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold cursor-pointer border-none transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Débannir
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                placeholder="Raison du bannissement..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-app-border dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-app-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                onClick={() => { if (banReason.trim()) banMutation.mutate({ userId: user.id, reason: banReason }); }}
                disabled={!banReason.trim() || banMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold cursor-pointer border-none transition-colors disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                Bannir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-app-gray dark:text-zinc-500 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-app-gray dark:text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-xs font-medium text-app-black dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

export const AdminUsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { data: users = [], isLoading } = useAdminUsers(search || undefined, statusFilter || undefined);

  const statusOptions = [
    { value: '', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'banned', label: 'Bannis' },
    { value: 'suspended', label: 'Suspendus' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-gray dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-app-border dark:border-zinc-700 bg-white dark:bg-zinc-900/60 text-sm text-app-black dark:text-white placeholder-app-gray dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-app-black dark:focus:ring-zinc-600 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none',
                statusFilter === opt.value
                  ? 'bg-white dark:bg-zinc-700 text-app-black dark:text-white shadow-sm'
                  : 'text-app-gray dark:text-zinc-400 hover:text-app-black dark:hover:text-white bg-transparent'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-app-border dark:border-zinc-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-app-border dark:border-zinc-700 border-t-app-black dark:border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-sm text-app-gray dark:text-zinc-500 mt-3">Chargement...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-border dark:border-zinc-800">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-app-gray dark:text-zinc-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-app-gray dark:text-zinc-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-app-gray dark:text-zinc-500 uppercase tracking-wider">Rôle</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-app-gray dark:text-zinc-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-app-gray dark:text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Inscrit</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border dark:divide-zinc-800">
              {users.map((user) => {
                const isBanned = !!user.bannedAt;
                const isSuspended = !!user.lockedUntil && new Date(user.lockedUntil) > new Date();
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-app-black dark:text-white truncate">{user.name}</p>
                          <p className="text-[11px] text-app-gray dark:text-zinc-500">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-app-gray dark:text-zinc-400">{user.email}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold',
                        user.role === 'admin' ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' :
                        user.role === 'moderator' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                        'bg-gray-100 dark:bg-zinc-800 text-app-gray dark:text-zinc-400'
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold',
                        isBanned ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                        isSuspended ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                        'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      )}>
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isBanned ? 'bg-red-500' : isSuspended ? 'bg-amber-500' : 'bg-emerald-500'
                        )} />
                        {isBanned ? 'Banni' : isSuspended ? 'Suspendu' : 'Actif'}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-xs text-app-gray dark:text-zinc-500">{timeAgo(user.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer bg-transparent border-none" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}>
                        <MoreHorizontal className="w-4 h-4 text-app-gray dark:text-zinc-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && users.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-app-gray dark:text-zinc-500">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
};
