import { Home, LandPlot, Layers, FerrisWheel, Landmark, LucideIcon, Flame, Unplug, Plug, Settings, ShieldCheck } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';
import { SandboxIcon } from '@/src/components/ui/SandboxIcon';

const GrimTotemIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2v20" />
    <path d="M8 6h8" />
    <path d="M7 10h10" />
    <path d="M6 14h12" />
    <path d="M10 18h4" />
    <circle cx="12" cy="10" r="2" />
  </svg>
);

const LayersPlusIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3-10 5 10 5 10-5-10-5Z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
    <path d="M16 19h6" fill="none" />
    <path d="M19 16v6" fill="none" />
  </svg>
);

const iconMap: Record<string, any> = {
  Home, Popular: LandPlot, Love: Flame, New: LayersPlusIcon, Explore: FerrisWheel, Tribu: Landmark, Totem: GrimTotemIcon, Sandbox: SandboxIcon,
  Connexion: Unplug, Admin: ShieldCheck,
};

const navItems = [
  { name: 'Home', icon: 'Home' },
  { name: 'Popular', icon: 'Popular' },
  { name: 'New', icon: 'New' },
  { name: 'Explore', icon: 'Explore' },
  { name: 'Connexion', icon: 'Connexion' },
  { name: 'Love', icon: 'Love' },
  { name: 'Tribu', icon: 'Tribu' },
  { name: 'Totem', icon: 'Totem' },
  { name: 'Messages', icon: 'Sandbox', badge: '+09' },
];

const adminItem = { name: 'Admin', icon: 'Admin' };

const isAdminRole = (role?: string) => role === 'admin' || role === 'superadmin';

export const SidebarNav = () => {
  const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar, isSidebarCollapsed, openChat } = useUIStore();
  const { setSelectedTotemUserId, setFeedSort, currentUser } = useAppStore();
  const isCollapsed = isSidebarCollapsed;

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
    
    if (name === 'Totem') {
      setSelectedTotemUserId('user-current');
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
                isActive ? 'text-white bg-app-black shadow-md' : 'text-app-gray hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-app-black dark:hover:text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-app-black dark:bg-zinc-800 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative">
                <IconComponent className={cn('w-5 h-5 transition-transform shrink-0', isActive ? 'scale-100' : 'group-hover:scale-110')} />
                {isCollapsed && item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#E27D60] text-[8px] font-bold text-white flex items-center justify-center animate-pulse">
                    !
                  </span>
                )}
              </div>
              {!isCollapsed && <span>{item.name}</span>}
              {!isCollapsed && item.badge && (
                <span className={cn('ml-auto text-xs font-bold px-2 py-0.5 rounded-full z-10', isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-app-black dark:text-zinc-300')}>
                  {item.badge}
                </span>
              )}
            </button>

            {item.name === 'Tribu' && !isCollapsed && (
              <div className="flex flex-col gap-1 text-[11px] font-bold text-app-gray dark:text-zinc-400 pl-8 mt-1">
                <button onClick={() => { setActiveTab('Tribu'); if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); }} className="flex items-center gap-1.5 hover:text-[#E27D60] cursor-pointer text-left py-1 text-app-black dark:text-zinc-300 bg-transparent border-none">
                  <span className="w-1 h-1 rounded-full bg-[#E27D60] shrink-0" />
                  t/YamatoTribe
                </button>
                <button onClick={() => { setActiveTab('Tribu'); if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); }} className="flex items-center gap-1.5 hover:text-[#E27D60] cursor-pointer text-left py-1 text-app-black dark:text-zinc-300 bg-transparent border-none">
                  <span className="w-1 h-1 rounded-full bg-[#E27D60] shrink-0" />
                  t/AndeanTribe
                </button>
                <button onClick={() => { setActiveTab('Tribu'); if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); }} className="flex items-center gap-1.5 hover:text-[#E27D60] cursor-pointer text-left py-1 text-app-black dark:text-zinc-300 bg-transparent border-none">
                  <span className="w-1 h-1 rounded-full bg-[#E27D60] shrink-0" />
                  t/AinuTribe
                </button>

                <div className="flex flex-col gap-1 mt-3 border-t border-app-border/40 dark:border-zinc-800 pt-2 w-full">
                  <span className="text-[9px] uppercase tracking-wider text-app-gray/60 dark:text-zinc-500 font-black mb-1 select-none">Your Own Tribes</span>
                  <div className="group/item flex items-center justify-between hover:text-[#E27D60] py-1 text-app-black dark:text-zinc-300 select-none">
                    <button onClick={() => { setActiveTab('Tribu'); if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); }} className="flex items-center gap-1.5 cursor-pointer text-left text-app-black dark:text-zinc-300 bg-transparent border-none hover:text-[#E27D60] flex-1 min-w-0 font-bold text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
                      <span className="truncate">t/MyFonHeritage</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveTab('TribuSettings'); }}
                      className="opacity-0 group-hover/item:opacity-100 hover:text-[#E27D60] p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer mr-1 flex items-center justify-center border-none bg-transparent"
                      title="Tribe Settings"
                    >
                      <Settings className="w-3.5 h-3.5 text-app-gray hover:text-[#E27D60] dark:text-zinc-400" />
                    </button>
                  </div>
                  <div className="group/item flex items-center justify-between hover:text-[#E27D60] py-1 text-app-black dark:text-zinc-300 select-none">
                    <button onClick={() => { setActiveTab('Tribu'); if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); }} className="flex items-center gap-1.5 cursor-pointer text-left text-app-black dark:text-zinc-300 bg-transparent border-none hover:text-[#E27D60] flex-1 min-w-0 font-bold text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
                      <span className="truncate">t/VoodooSecrets</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveTab('TribuSettings'); }}
                      className="opacity-0 group-hover/item:opacity-100 hover:text-[#E27D60] p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer mr-1 flex items-center justify-center border-none bg-transparent"
                      title="Tribe Settings"
                    >
                      <Settings className="w-3.5 h-3.5 text-app-gray hover:text-[#E27D60] dark:text-zinc-400" />
                    </button>
                  </div>
                </div>
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
                isActive ? 'text-white bg-app-black shadow-md' : 'text-app-gray hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-app-black dark:hover:text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-app-black dark:bg-zinc-800 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <AdminIcon className={cn('w-5 h-5 transition-transform shrink-0', isActive ? 'scale-100' : 'group-hover:scale-110')} />
              {!isCollapsed && <span>{adminItem.name}</span>}
            </button>
          </div>
        );
      })()}
    </nav>
  );
};
