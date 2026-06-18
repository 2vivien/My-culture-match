import { Home, LandPlot, Layers, FerrisWheel, Landmark, LucideIcon } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

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

const ThunderbirdIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M9.948 4.444h-.005c-1.92.788-2.126 2.55-1.817 3.499v.02C9.236 7.18 10.658 6.76 12 6.76c3.26 0 5.902 2.156 5.902 4.815 0 2.66-2.643 4.816-5.902 4.816l-.083-.002c-.155-.006-.354-.013-.435.118-.096.156.116.397.238.536 1.274 1.441 3.123 1.622 3.608 1.67l.076.008c-4.281.414-9.304-2.32-9.306-7.076 0-1.12.414-2.073 1.075-2.83l-.005-.002h-.003C7.31 6.38 6.376 3.47 4.629 2.898c-.124-.04-.246.054-.262.183-.23 1.924-.727 2.59-1.264 3.31-.805 1.08-1.39 2.328-1.365 3.698a10.99 10.99 0 0 1-.705-1.91c-.024-.09-.17-.365-.333-.272-.13.072-.227.274-.296.485A12.137 12.137 0 0 0 0 11.489c0 6.536 5.475 12 12 12 6.627 0 12-5.372 12-12 0-2.526-.781-4.87-2.115-6.805l.167-.002c.518 0 1.024.045 1.51.129-.734-.816-1.724-1.475-2.877-1.904a8.54 8.54 0 0 1 2.494-.495c-1.426-1.166-3.508-1.9-5.827-1.9-3.355 0-6.648 1.29-7.404 3.93zm.682 9.166c-.87-.905-3.473-3.91-3.473-3.91l.202.01 4.075 3.042c.305.223.74.22 1.043-.004l3.996-3.034.212-.018s-2.518 2.935-3.483 3.9c-.964.968-1.703.919-2.572.014zm2.774-10.083s.055.625-.576.824c-.722.227-1.042-.38-1.042-.38s.09-.417.676-.61c.626-.206.942.166.942.166z" />
  </svg>
);

const iconMap: Record<string, any> = {
  Home, LandPlot, Layers, FerrisWheel, Landmark, Shield: GrimTotemIcon, Thunderbird: ThunderbirdIcon,
};

const navItems = [
  { name: 'Home', icon: 'Home', badge: '20+' },
  { name: 'Popular', icon: 'LandPlot' },
  { name: 'New', icon: 'Layers' },
  { name: 'Explore', icon: 'FerrisWheel' },
  { name: 'Tribu', icon: 'Landmark' },
  { name: 'Totem', icon: 'Shield' },
  { name: 'Thunderbird', icon: 'Thunderbird', badge: '+09' },
];

export const SidebarNav = () => {
  const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar } = useUIStore();
  const { setSelectedTotemUserId } = useAppStore();
  const isCollapsed = activeTab === 'Chat' || activeTab === 'Thunderbird';

  const handleNav = (name: string) => {
    setActiveTab(name);
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
          <button
            key={item.name}
            onClick={() => handleNav(item.name)}
            title={item.name}
            className={cn(
              'relative flex items-center rounded-2xl transition-all cursor-pointer group',
              isCollapsed ? 'justify-center p-3 w-12 mx-auto' : 'gap-4 px-4 py-3 w-full text-left font-medium text-sm',
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
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
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
        );
      })}
    </nav>
  );
};
