import { Heart, X } from 'lucide-react';
import { useRequests } from '@/src/hooks/useRequests';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Button } from '@/src/components/ui/button';
import { userService } from '@/src/services/userService';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';

export const RequestCard = () => {
  const { requests, respondToRequest } = useRequests();
  const { setSelectedTotemUserId } = useAppStore();
  const { setActiveTab } = useUIStore();

  if (requests.length === 0) return null;

  const current = requests[0];
  const user = userService.getUserById('req-1');

  const handleClick = () => {
    setSelectedTotemUserId('req-1');
    setActiveTab('Totem');
  };

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-float border border-app-border relative select-none">
      <div className="absolute -top-3 left-6 bg-white border border-app-border rounded-full px-3 py-1 text-xs font-bold shadow-sm z-10 flex items-center gap-1 text-app-black">
        +9 Notifications
      </div>

      <div className="flex items-center justify-between mb-4 pt-2">
        <h3 className="font-semibold text-sm text-app-black">Requests</h3>
        <span className="text-xs text-app-gray">{current.timeAgo}</span>
        <button onClick={() => respondToRequest({ id: current.id, action: 'block' })} className="text-app-gray hover:text-app-black cursor-pointer">
          <X className="w-4 h-4 animate-spin-hover" />
        </button>
      </div>

      <div className="flex items-center gap-3 bg-[#FCFCFC] p-3 rounded-2xl mb-4 text-app-black border border-app-border">
        <div className="relative">
          <TotemAvatar src={current.avatar} alt={current.name} size="md" glow={user?.glow || 'turquoise'} level={user?.level} onClick={handleClick} />
          <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full select-none z-20">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
              <Heart className="w-2.5 h-2.5 fill-current" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h4 onClick={handleClick} className="font-bold text-sm leading-tight cursor-pointer hover:underline">{current.name}</h4>
          <p className="text-xs text-app-gray leading-tight mt-0.5">{current.actionText}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => respondToRequest({ id: current.id, action: 'block' })} className="flex-1 py-2.5">Block</Button>
        <Button onClick={() => respondToRequest({ id: current.id, action: 'okay' })} className="flex-1 py-2.5 bg-blue-600 text-white hover:bg-blue-700 shadow-md">Okay</Button>
      </div>
    </div>
  );
};
