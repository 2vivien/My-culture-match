import { Users, Plus, Newspaper } from 'lucide-react';

export const SidebarMiniNav = () => {
  return (
    <div className="flex items-center justify-between px-4 mb-8 text-app-gray select-none">
      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-app-black transition-colors">
        <Users className="w-5 h-5" />
        <span className="text-[10px] uppercase font-semibold">Requests</span>
      </div>
      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-app-black transition-colors">
        <Plus className="w-5 h-5" />
        <span className="text-[10px] uppercase font-semibold">New</span>
      </div>
      <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-app-black transition-colors">
        <Newspaper className="w-5 h-5" />
        <span className="text-[10px] uppercase font-semibold">News</span>
      </div>
    </div>
  );
};
