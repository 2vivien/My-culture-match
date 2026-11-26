import { DiamondPlus, SlidersHorizontal, LogOut, Info, Book, Lock, Accessibility, Briefcase } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export const SidebarFooter = () => {
  const { logout } = useAppStore();
  const { activeTab, setActiveTab, isSidebarCollapsed, setShowCreateTribeModal } = useUIStore();
  const isCollapsed = isSidebarCollapsed;

  return (
    <div className="flex flex-col gap-2 select-none w-full text-sm">
      <hr className="border-app-border mb-2 mx-4" />

      <Button
        variant="ghost"
        title="Créer une communauté"
        onClick={() => setShowCreateTribeModal(true)}
        className={cn(
          "w-full text-app-gray hover:text-app-black dark:text-zinc-400 dark:hover:text-white font-medium py-3 px-4 rounded-2xl",
          isCollapsed ? "justify-center p-3 w-12 mx-auto" : "justify-start gap-4"
        )}
      >
        <DiamondPlus className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span>Créer une communauté</span>}
      </Button>

      <Button
        variant="ghost"
        title="Settings"
        onClick={() => setActiveTab('Settings')}
        className={cn(
          "w-full text-app-gray hover:text-app-black dark:text-zinc-400 dark:hover:text-white font-medium py-3 px-4 rounded-2xl",
          isCollapsed ? "justify-center p-3 w-12 mx-auto" : "justify-start gap-4"
        )}
      >
        <SlidersHorizontal className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span>Settings</span>}
      </Button>

      {!isCollapsed && (
        <div className="px-4 py-2 flex flex-col gap-2 text-xs text-app-gray mt-1 font-medium">
          <a href="#" className="flex items-center gap-2 hover:text-app-black dark:hover:text-white transition-colors">
            <Info className="w-4 h-4 shrink-0" /> About MyCultureMatch
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-app-black dark:hover:text-white transition-colors">
            <Book className="w-4 h-4 shrink-0" /> MyCultureMatch Rules
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-app-black dark:hover:text-white transition-colors">
            <Briefcase className="w-4 h-4 shrink-0" /> Careers
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-app-black dark:hover:text-white transition-colors">
            <Lock className="w-4 h-4 shrink-0" /> Privacy Policy
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-app-black dark:hover:text-white transition-colors">
            <Accessibility className="w-4 h-4 shrink-0" /> Accessibility
          </a>
        </div>
      )}

      <Button
        variant="ghost"
        title="Log out"
        onClick={logout}
        className={cn(
          "w-full text-app-gray hover:text-app-black dark:text-zinc-400 dark:hover:text-white font-medium py-3 px-4 rounded-2xl mt-2",
          isCollapsed ? "justify-center p-3 w-12 mx-auto" : "justify-start gap-4"
        )}
      >
        <LogOut className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span>Log out</span>}
      </Button>
    </div>
  );
};
