import { Moon, Sun, DiamondPlus, SlidersHorizontal, LogOut, Info, Book, Lock, Accessibility, Briefcase } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export const SidebarFooter = () => {
  const { theme, toggleTheme } = useAppStore();
  const { activeTab } = useUIStore();
  const isCollapsed = activeTab === 'Chat' || activeTab === 'Thunderbird';

  return (
    <div className="flex flex-col gap-2 select-none w-full text-sm">
      <hr className="border-app-border mb-2 mx-4" />
      
      <Button
        variant="ghost"
        title="Créer un tribu"
        className={cn(
          "w-full text-app-gray hover:text-app-black dark:text-zinc-400 dark:hover:text-white font-medium py-3 px-4 rounded-2xl",
          isCollapsed ? "justify-center p-3 w-12 mx-auto" : "justify-start gap-4"
        )}
      >
        <DiamondPlus className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span>Créer un tribu</span>}
      </Button>

      <Button
        variant="ghost"
        title="Settings"
        className={cn(
          "w-full text-app-gray hover:text-app-black dark:text-zinc-400 dark:hover:text-white font-medium py-3 px-4 rounded-2xl",
          isCollapsed ? "justify-center p-3 w-12 mx-auto" : "justify-start gap-4"
        )}
      >
        <SlidersHorizontal className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span>Settings</span>}
      </Button>

      {!isCollapsed && (
        <div className="px-4 py-2 flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-app-black dark:text-white">Theme</span>
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full p-1">
              <button 
                onClick={() => theme !== 'light' && toggleTheme()} 
                className={cn("p-1.5 rounded-full transition-colors", theme === 'light' ? "bg-white text-app-black shadow-sm" : "text-app-gray hover:text-app-black dark:hover:text-white")}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => theme !== 'dark' && toggleTheme()} 
                className={cn("p-1.5 rounded-full transition-colors", theme === 'dark' ? "bg-app-black text-white shadow-sm dark:bg-zinc-700" : "text-app-gray hover:text-app-black dark:hover:text-white")}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div className="px-4 py-3 flex flex-col gap-3 text-xs text-app-gray mt-2 font-medium">
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
