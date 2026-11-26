import logoMyCultureMatch from '@/assets/logo-myculturematch.png';
import { useUIStore } from '@/src/stores/useUIStore';

export const SidebarLogo = () => {
  const { isSidebarCollapsed } = useUIStore();
  const isCollapsed = isSidebarCollapsed;

  return (
    <div className={`flex h-20 md:h-24 shrink-0 select-none items-center px-4 ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}>
      <img
        src={logoMyCultureMatch}
        alt="MyCultureMatch Logo"
        className="w-8 h-8 object-contain rounded-lg shrink-0"
      />
      {!isCollapsed && <span className="font-bold text-lg tracking-tight text-app-black dark:text-white">MyCultureMatch</span>}
    </div>
  );
};
