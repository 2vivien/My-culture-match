import { Plus, MoreHorizontal } from 'lucide-react';
import { useMessages } from '@/src/hooks/useMessages';
import { MessageItem } from './MessageItem';
import { Button } from '@/src/components/ui/button';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';

export const MessagesPanel = () => {
  const { messages, toggleNotifications } = useMessages();
  const { setActiveTab } = useUIStore();
  const { setSelectedTotemUserId } = useAppStore();

  const handleActiveClick = () => {
    setSelectedTotemUserId('m4'); 
    setActiveTab('Totem');
  };

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-soft border border-app-border flex-1 flex flex-col select-none">
      <div className="flex items-center justify-between mb-6">
        <div onClick={handleActiveClick} className="flex items-center gap-2 border border-app-black rounded-full px-4 py-1.5 cursor-pointer hover:bg-[#FCFCFC] transition-colors">
          <span className="font-bold text-sm text-app-black">Messages</span>
          <TotemAvatar
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=50&q=80"
            alt="active user"
            size="xs"
            glow="violet"
            level={21}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-[#FCFCFC] border border-app-border flex items-center justify-center hover:bg-white transition-colors cursor-pointer text-app-black">
            <Plus className="w-4 h-4" />
          </button>
          <button className="text-app-gray hover:text-app-black cursor-pointer">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto hide-scrollbar flex-1 max-h-[280px]">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} onToggleNotification={() => toggleNotifications(message.id)} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-app-border text-center">
        <Button variant="primary" className="text-xs font-semibold py-2 px-6">See all</Button>
      </div>
    </div>
  );
};
