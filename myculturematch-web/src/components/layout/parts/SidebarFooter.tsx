import { Info, Book, Lock, Accessibility, Briefcase } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';

export const SidebarFooter = () => {
  const { isSidebarCollapsed } = useUIStore();
  const isCollapsed = isSidebarCollapsed;

  if (isCollapsed) return null;

  return (
    <div className="flex flex-col gap-2 select-none w-full text-sm">
      <hr className="border-app-border mb-2 mx-4" />
      <div className="px-4 py-2 flex flex-col gap-2 text-xs text-app-gray font-medium">
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
    </div>
  );
};
