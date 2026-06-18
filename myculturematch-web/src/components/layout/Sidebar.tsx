import { SidebarLogo } from './parts/SidebarLogo';

import { SidebarNav } from './parts/SidebarNav';
import { SidebarFooter } from './parts/SidebarFooter';
import { useUIStore } from '@/src/stores/useUIStore';
import { cn } from '@/src/lib/utils';
import { PanelRightOpen } from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, isSidebarOpen, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const isCollapsed = isSidebarCollapsed;

  return (
    <>
      {/* Mobile backdrop overlay to close sidebar */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/45 dark:bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Wrapper to allow the toggle button to overflow the right border without being clipped by overflow-hidden */}
      <div className={cn(
        "relative shrink-0 transition-all duration-300 ease-in-out z-50 md:h-full",
        isCollapsed ? "md:w-20" : "md:w-64",
        // Mobile drawer overlay behavior (keeps fixed styling)
        "fixed top-0 bottom-0 left-0 h-full w-64 md:relative md:translate-x-0 md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <aside className={cn(
          "bg-white dark:bg-zinc-950 border-r border-app-border flex flex-col py-6 select-none transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden hide-scrollbar w-full h-full",
          isCollapsed ? "px-2" : "px-4"
        )}>
          <SidebarLogo />

          {!isCollapsed && (
            <p className="text-xs text-app-gray font-semibold uppercase tracking-wider px-4 mb-4 select-none mt-2">
              Menu
            </p>
          )}
          <SidebarNav />
          <div className="mt-8">
            <SidebarFooter />
          </div>
        </aside>

        {/* Circular resize/fold handle button positioned over the right border */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden md:flex absolute top-6 -right-3.5 w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 shadow-md items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:scale-105 transition-all cursor-pointer z-50"
          title={isCollapsed ? "Expand menu" : "Collapse menu"}
        >
          <PanelRightOpen className={cn("w-4 h-4 transition-transform duration-300", !isCollapsed && "rotate-180")} />
        </button>
      </div>
    </>
  );
};
