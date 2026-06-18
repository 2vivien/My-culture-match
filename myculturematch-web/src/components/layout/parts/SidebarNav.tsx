import { Home, LandPlot, Layers, FerrisWheel, Landmark, LucideIcon, Flame } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';
import { ThunderbirdIcon } from '@/src/components/ui/ThunderbirdIcon';

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
  Home, Popular: LandPlot, Love: Flame, New: LayersPlusIcon, Explore: FerrisWheel, Tribu: Landmark, Totem: GrimTotemIcon, Thunderbird: ThunderbirdIcon,
};

const navItems = [
  { name: 'Home', icon: 'Home' },
  { name: 'Popular', icon: 'Popular' },
  { name: 'New', icon: 'New' },
  { name: 'Explore', icon: 'Explore' },
  { name: 'Love', icon: 'Love' },
  { name: 'Tribu', icon: 'Tribu' },
  { name: 'Totem', icon: 'Totem' },
  { name: 'Thunderbird', icon: 'Thunderbird', badge: '+09' },
];

export const SidebarNav = () => {
  const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar, isSidebarCollapsed } = useUIStore();
  const { setSelectedTotemUserId, setFeedSort } = useAppStore();
  const isCollapsed = isSidebarCollapsed;

  const handleNav = (name: string) => {
    if (name === 'Tribu') return; // Do nothing for main Tribu click
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
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
