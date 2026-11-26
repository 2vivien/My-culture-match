import { Home, LandPlot, Layers, FerrisWheel, Landmark, LucideIcon, Settings, ShieldCheck } from 'lucide-react';
import { IconFriends, IconId } from '@tabler/icons-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { useExplore } from '@/src/hooks/useExplore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/src/services/postService';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';
import { SandboxIcon } from '@/src/components/ui/SandboxIcon';

/** Icône Tabler "cloud-heart" (ti-cloud-heart, unicode f853) pour Love. */
const CloudHeartIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 18.004h-3.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99" />
    <path d="M18 22l3.35 -3.284a2.143 2.143 0 0 0 .005 -3.071a2.242 2.242 0 0 0 -3.129 -.006l-.224 .22l-.223 -.22a2.242 2.242 0 0 0 -3.128 -.006a2.143 2.143 0 0 0 -.006 3.071l3.355 3.296" />
  </svg>
);

/** Icône Profil Tabler "id" (ti-id) — exportée pour le menu profil. */
export const ProfileIcon = (props: any) => <IconId {...props} />;

const LayersPlusIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3-10 5 10 5 10-5-10-5Z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
    <path d="M16 19h6" fill="none" />
    <path d="M19 16v6" fill="none" />
  </svg>
);

/** Tribu possédée/adhésion renvoyée par GET /api/tribes/mine. */
interface OwnedTribe {
  id: string;
  name: string;
  role?: string | null;
}

const iconMap: Record<string, any> = {
  Home, Popular: LandPlot, Love: CloudHeartIcon, New: LayersPlusIcon, Explore: FerrisWheel, Tribu: Landmark, Profil: ProfileIcon, Sandbox: SandboxIcon,
  Friends: IconFriends, Admin: ShieldCheck,
};

const navItems = [
  { name: 'Home', icon: 'Home' },
  { name: 'Popular', icon: 'Popular' },
  { name: 'New', icon: 'New' },
  { name: 'Explore', icon: 'Explore' },
  { name: 'Friends', icon: 'Friends' },
  { name: 'Love', icon: 'Love' },
  { name: 'Tribu', icon: 'Tribu' },
  { name: 'Profil', icon: 'Profil' },
];

const adminItem = { name: 'Admin', icon: 'Admin' };

const isAdminRole = (role?: string) => role === 'admin' || role === 'superadmin';

export const SidebarNav = () => {
  const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar, isSidebarCollapsed, openChat } = useUIStore();
  const { setSelectedProfileUserId, setFeedSort, currentUser, setSelectedTribeId } = useAppStore();
  const { tribes } = useExplore();
  const queryClient = useQueryClient();
  const isCollapsed = isSidebarCollapsed;

  // Tribus réelles : celles de l'utilisateur en priorité, sinon les plus populaires (API)
  const suggestedTribes = tribes.slice(0, 3);

  // Mes tribus — endpoint dédié /api/tribes/mine (owner d'abord), rafraîchi après création
  // (useCreateTribe invalide ['my-tribes'] et ['tribe-options'] à la soumission).
  const { data: myTribesData = [] } = useQuery<OwnedTribe[]>({
    queryKey: ['my-tribes'],
    queryFn: postService.getMyTribes,
    staleTime: 1000 * 30,
  });
  const myTribes = myTribesData.slice(0, 4);

  const showAdmin = isAdminRole(currentUser.role);

  const handleNav = (name: string) => {
    if (name === 'Tribu') return; // Do nothing for main Tribu click
    if (name === 'Messages') {
      openChat();
      return;
    }
    setActiveTab(name);
    if (name === 'Popular') {
      setFeedSort('Popular');
    } else if (name === 'New') {
      setFeedSort('New');
    } else if (name === 'Home') {
      setFeedSort('Best');
    }

    if (name === 'Profil') {
      // "My Profile" : l'icône Profile de la sidebar ouvre toujours
      // SON propre profil (jamais le profil d'un autre utilisateur).
      setSelectedProfileUserId('user-current');
    }
    if (window.innerWidth < 768 && isSidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <nav className="flex flex-col gap-1.5 select-none w-full">
      {navItems.map((item) => {
        const IconComponent = iconMap[item.icon] || Home;
        const isActive = activeTab === item.name;

        return (
          <div key={item.name} className="flex flex-col w-full gap-1">
            <button
              onClick={() => handleNav(item.name)}
              title={item.name}
              className={cn(
                'relative flex items-center rounded-2xl transition-all cursor-pointer group w-full',
                isCollapsed ? 'justify-center p-3 w-12 mx-auto' : 'gap-4 px-4 py-3 text-left font-medium text-sm',
                isActive ? 'text-app-black dark:text-white bg-zinc-100 dark:bg-zinc-800/60 shadow-none' : 'text-app-gray hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-app-black dark:hover:text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative">
                <IconComponent className={cn('w-6 h-6 transition-transform shrink-0', isActive ? 'scale-100' : 'group-hover:scale-110')} />
              </div>
              {!isCollapsed && <span className="text-base font-semibold">{item.name}</span>}
            </button>

            {item.name === 'Tribu' && !isCollapsed && (
              <div className="flex flex-col gap-1 text-sm font-bold text-app-gray dark:text-zinc-400 pl-9 mt-1">
                {suggestedTribes.length === 0 && (
                  <p className="text-xs text-app-gray/70 dark:text-zinc-500 py-1 select-none">Aucune tribu pour l'instant</p>
                )}
                {suggestedTribes.map((tribe) => (
                  <button
                    key={tribe.id}
                    onClick={() => { setSelectedTribeId(tribe.id); setActiveTab('Tribu'); if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); }}
                    className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer text-left py-1 text-app-black dark:text-zinc-300 bg-transparent border-none"
                  >
                    <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                    <span className="truncate">t/{tribe.name}</span>
                  </button>
                ))}

                {myTribes.length > 0 && (
                  <div className="flex flex-col gap-1 mt-3 border-t border-app-border/40 dark:border-zinc-800 pt-2 w-full">
                    <span className="text-[11px] uppercase tracking-wider text-app-gray/60 dark:text-zinc-500 font-black mb-1 select-none">Your Own Tribes</span>
                    {myTribes.map((tribe) => (
                      <div key={tribe.id} className="group/item flex items-center justify-between hover:text-zinc-900 dark:hover:text-zinc-100 py-1 text-app-black dark:text-zinc-300 select-none">
                        <button onClick={() => { setSelectedTribeId(tribe.id); setActiveTab('Tribu'); if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); }} className="flex items-center gap-1.5 cursor-pointer text-left text-app-black dark:text-zinc-300 bg-transparent border-none hover:text-zinc-900 dark:hover:text-zinc-100 flex-1 min-w-0 font-bold text-sm">
                          <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
                          <span className="truncate">t/{tribe.name}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveTab('TribuSettings'); }}
                          className="opacity-0 group-hover/item:opacity-100 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer mr-1 flex items-center justify-center border-none bg-transparent"
                          title="Tribe Settings"
                        >
                          <Settings className="w-4 h-4 text-app-gray hover:text-zinc-900 dark:hover:text-zinc-100 dark:text-zinc-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {/* Admin nav item — only visible for admins */}
      {showAdmin && (() => {
        const AdminIcon = iconMap[adminItem.icon] || ShieldCheck;
        const isActive = activeTab === adminItem.name;
        return (
          <div className="mt-2 pt-2 border-t border-app-border/40 dark:border-zinc-800">
            <button
              onClick={() => handleNav(adminItem.name)}
              title={adminItem.name}
              className={cn(
                'relative flex items-center rounded-2xl transition-all cursor-pointer group w-full',
                isCollapsed ? 'justify-center p-3 w-12 mx-auto' : 'gap-4 px-4 py-3 text-left font-medium text-sm',
                isActive ? 'text-app-black dark:text-white bg-zinc-100 dark:bg-zinc-800/60 shadow-none' : 'text-app-gray hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-app-black dark:hover:text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-admin"
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <AdminIcon className={cn('w-6 h-6 transition-transform shrink-0', isActive ? 'scale-100' : 'group-hover:scale-110')} />
              {!isCollapsed && <span className="text-base font-semibold">{adminItem.name}</span>}
            </button>
          </div>
        );
      })()}
    </nav>
  );
};
