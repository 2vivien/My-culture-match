import { Settings, Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export const SidebarFooter = () => {
  const { theme, toggleTheme } = useAppStore();
  const { activeTab } = useUIStore();
  const isCollapsed = activeTab === 'Chat';

  return (
    <div className="flex flex-col gap-2 select-none w-full">
      <Button
        variant="ghost"
        title="Settings"
        className={cn(
          "w-full text-app-gray hover:text-app-black font-medium text-sm py-3 px-4 rounded-2xl",
          isCollapsed ? "justify-center p-3 w-12 mx-auto" : "justify-start gap-4"
        )}
      >
        <Settings className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span>Settings</span>}
      </Button>

      <Button
        variant="purple"
        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        onClick={toggleTheme}
        className={cn(
          "w-full font-semibold text-sm py-3 px-4 rounded-2xl justify-start",
          isCollapsed ? "justify-center p-3 w-12 mx-auto" : "gap-4"
        )}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="w-5 h-5 text-purple-600 shrink-0" />
            {!isCollapsed && <span>Light Mode</span>}
          </>
        ) : (
          <>
            <Moon className="w-5 h-5 text-purple-600 shrink-0" />
            {!isCollapsed && <span>Dark Mode</span>}
          </>
        )}
      </Button>
    </div>
  );
};
