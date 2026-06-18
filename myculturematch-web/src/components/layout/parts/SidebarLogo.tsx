import { Earth } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';

export const SidebarLogo = () => {
  const { activeTab, isSidebarCollapsed } = useUIStore();
  const isCollapsed = isSidebarCollapsed || activeTab === 'Chat' || activeTab === 'Thunderbird';

  return (
    <div className={`flex select-none mb-8 items-center px-4 ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}>
      <div className="w-8 h-8 rounded-lg bg-app-black text-white dark:bg-zinc-800 dark:text-zinc-100 flex items-center justify-center shrink-0">
        <Earth className="w-5 h-5" />
      </div>
      {!isCollapsed && <span className="font-bold text-lg tracking-tight text-app-black dark:text-white">MyCultureMatch</span>}
    </div>
  );
};
