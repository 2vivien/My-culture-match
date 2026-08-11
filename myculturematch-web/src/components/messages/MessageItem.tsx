import React from 'react';
import { SandboxIcon } from '@/src/components/ui/SandboxIcon';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Message } from '@/src/types/message';
import { userService } from '@/src/services/userService';
import { useUIStore } from '@/src/stores/useUIStore';

interface MessageItemProps {
  message: Message;
  onToggleNotification: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onToggleNotification }) => {
  const { openChat } = useUIStore();
  const user = userService.getUserById(message.id);

  const handleClick = () => {
    openChat();
  };

  return (
    <div onClick={handleClick} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-[#FCFCFC] dark:hover:bg-zinc-800 transition-colors select-none">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <TotemAvatar src={message.img} alt={message.name} size="sm" glow={user?.glow || 'none'} level={user?.level} />
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm text-app-black dark:text-zinc-100 group-hover:text-[#E27D60] transition-colors leading-tight">
            {message.name}
          </h4>
          <p className="text-xs text-app-gray leading-tight mt-0.5 truncate max-w-[170px]">
            {message.lastMessage || message.role}
          </p>
        </div>
      </div>
      <div className="relative flex items-center justify-center shrink-0 w-8 h-8 mr-1">
        <SandboxIcon className="w-5 h-5 text-app-black dark:text-zinc-300" />
        <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center bg-[#E27D60] text-[9px] font-black text-white shadow-sm">
          {message.id === 'm1' ? '1' : message.id === 'm2' ? '5' : message.id === 'm3' ? '99+' : '2'}
        </span>
      </div>
    </div>
  );
};
