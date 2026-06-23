import logoMyCultureMatch from '@/assets/logo-myculturematch.png';
import { useUIStore } from '@/src/stores/useUIStore';

export const SidebarLogo = () => {
  const { activeTab, isSidebarCollapsed } = useUIStore();
  const isCollapsed = isSidebarCollapsed || activeTab === 'Chat' || activeTab === 'Thunderbird';

  return (
    <div className={`flex select-none mb-8 items-center px-4 ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}>
      <img
        src={logoMyCultureMatch}
        alt="MyCultureMatch Logo"
        className="w-8 h-8 object-contain rounded-lg shrink-0"
      />
      {!isCollapsed && <span className="font-bold text-lg tracking-tight text-app-black dark:text-white">MyCultureMatch</span>}
    </div>
  );
};
