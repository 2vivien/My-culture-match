import { SidebarLogo } from './parts/SidebarLogo';
import { SidebarMiniNav } from './parts/SidebarMiniNav';
import { SidebarNav } from './parts/SidebarNav';
import { SidebarFooter } from './parts/SidebarFooter';
import { useUIStore } from '@/src/stores/useUIStore';
import { cn } from '@/src/lib/utils';

export const Sidebar = () => {
  const { activeTab, isSidebarOpen, toggleSidebar } = useUIStore();
  const isCollapsed = activeTab === 'Chat';

  return (
    <>
      {/* Mobile backdrop overlay to close sidebar */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside className={cn(
        "bg-white dark:bg-zinc-950 border-r border-app-border flex flex-col justify-between py-6 shrink-0 select-none transition-all duration-300 ease-in-out",
        // Desktop layouts
        "md:h-full md:relative md:translate-x-0 z-40",
        isCollapsed ? "md:w-20 md:px-2" : "md:w-64 md:px-4",
        // Mobile drawer overlay behavior
        "fixed top-0 bottom-0 left-0 h-full w-64 px-4 shadow-2xl md:shadow-none z-50",
        isSidebarOpen ? "translate-x-0 animate-in slide-in-from-left duration-250" : "-translate-x-full"
      )}>
        <div className="flex flex-col overflow-x-hidden">
          <SidebarLogo />
          {!isCollapsed && <SidebarMiniNav />}
          {!isCollapsed && (
            <p className="text-xs text-app-gray font-semibold uppercase tracking-wider px-4 mb-4 select-none">
              Menu
            </p>
          )}
          <SidebarNav />
        </div>
        <SidebarFooter />
      </aside>
    </>
  );
};
