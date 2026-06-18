import { Earth } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';

export const SidebarLogo = () => {
  const { activeTab } = useUIStore();
  const isCollapsed = activeTab === 'Chat' || activeTab === 'Thunderbird';

  return (
    <div className="flex items-center gap-3 px-4 mb-10 cursor-pointer select-none">
      <div className="w-8 h-8 rounded-lg bg-app-black text-white dark:bg-zinc-800 dark:text-zinc-100 flex items-center justify-center shrink-0">
        <Earth className="w-5 h-5" />
      </div>
      {!isCollapsed && <span className="font-bold text-lg tracking-tight text-app-black dark:text-white">MyCultureMatch</span>}
    </div>
  );
};
