import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Message } from '@/src/types/message';
import { userService } from '@/src/services/userService';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';

interface MessageItemProps {
  message: Message;
  onToggleNotification: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onToggleNotification }) => {
  const { setSelectedTotemUserId } = useAppStore();
  const { setActiveTab } = useUIStore();
  const user = userService.getUserById(message.id);

  const handleClick = () => {
    setSelectedTotemUserId(message.id);
    setActiveTab('Totem');
  };

  return (
    <div onClick={handleClick} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-[#FCFCFC] transition-colors select-none">
      <div className="flex items-center gap-3">
        <TotemAvatar src={message.img} alt={message.name} size="sm" glow={user?.glow || 'none'} level={user?.level} />
        <div>
          <h4 className="font-bold text-sm text-app-black group-hover:text-blue-600 transition-colors leading-tight">
            {message.name}
          </h4>
          <p className="text-xs text-app-gray leading-tight mt-0.5">{message.role}</p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleNotification();
        }}
        className="flex flex-col items-center gap-0.5 cursor-pointer text-app-gray hover:text-app-black select-none font-bold"
      >
        {message.notificationsOn ? (
          <Bell className="w-3.5 h-3.5 text-app-gray" />
        ) : (
          <BellOff className="w-3.5 h-3.5 text-red-500" />
        )}
        <span className="text-[9px] uppercase tracking-wider text-app-gray font-bold">on</span>
      </button>
    </div>
  );
};
