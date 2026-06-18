import { Newspaper, Compass, Users, Shield, MessageCircle, LucideIcon } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

const iconMap: Record<string, LucideIcon> = {
  Newspaper, Compass, Users, Shield, MessageCircle,
};

const navItems = [
  { name: 'Feed', icon: 'Newspaper', badge: '20+' },
  { name: 'Discover', icon: 'Compass' },
  { name: 'Tribu', icon: 'Users' },
  { name: 'Totem', icon: 'Shield' },
  { name: 'Chat', icon: 'MessageCircle', badge: '+09' },
];

export const SidebarNav = () => {
  const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar } = useUIStore();
  const { setSelectedTotemUserId } = useAppStore();
  const isCollapsed = activeTab === 'Chat';

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
        const IconComponent = iconMap[item.icon] || Compass;
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
