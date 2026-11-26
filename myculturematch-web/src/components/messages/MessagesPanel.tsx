import { Plus, MoreHorizontal } from 'lucide-react';
import { SandboxIcon } from '@/src/components/ui/SandboxIcon';
import { useMessages } from '@/src/hooks/useMessages';
import { useUnreadMessagesCount } from '@/src/hooks/useUnreadMessagesCount';
import { MessageItem } from './MessageItem';
import { Button } from '@/src/components/ui/button';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';

export const MessagesPanel = () => {
  const { messages, toggleNotifications } = useMessages();
  const { openChat } = useUIStore();
  const { currentUser } = useAppStore();
  const { data: unreadMessages } = useUnreadMessagesCount();

  const handleActiveClick = () => {
    openChat();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-soft border border-app-border flex-1 flex flex-col select-none">
      <div className="flex items-center justify-between mb-6">
        <div onClick={handleActiveClick} className="flex items-center gap-2 border border-app-black dark:border-zinc-700 rounded-full px-4 py-1.5 cursor-pointer hover:bg-[#FCFCFC] dark:hover:bg-zinc-800 transition-colors">
          <SandboxIcon className="w-4 h-4 text-app-black dark:text-zinc-200" />
          <span className="font-bold text-sm text-app-black dark:text-zinc-200">Messages</span>
          <ProfileAvatar
            src={currentUser.avatar}
            alt={currentUser.name}
            countryFlag={currentUser.country}
            size="xs"
            glow="violet"
          />
        </div>
        <div className="flex items-center gap-2">
          {(unreadMessages ?? 0) > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-[#E27D60] text-[9px] font-black text-white shadow-sm">
              {(unreadMessages ?? 0) > 99 ? '99+' : unreadMessages}
            </span>
          )}
          <button className="w-8 h-8 rounded-full bg-[#FCFCFC] dark:bg-zinc-800 border border-app-border flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer text-app-black dark:text-zinc-100">
            <Plus className="w-4 h-4" />
          </button>
          <button className="text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer">
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
        <Button onClick={openChat} variant="primary" className="text-xs font-semibold py-2 px-6">See all</Button>
      </div>
    </div>
  );
};
