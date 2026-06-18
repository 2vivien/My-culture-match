import React from 'react';
import { ChatMessage } from '@/src/types/chat.types';
import { cn } from '@/src/lib/utils';
import { Volume2, FileText, CheckCheck } from 'lucide-react';

interface BubbleProps {
  message: ChatMessage;
}

export const ChatMessageBubble: React.FC<BubbleProps> = ({ message }) => {
  const isMe = message.senderId === 'me';

  return (
    <div className={cn('flex flex-col mb-3 animate-fade-in max-w-[85%]', isMe ? 'ml-auto items-end' : 'mr-auto items-start')}>
      <span className="text-[10px] text-app-gray dark:text-zinc-500 mb-1 px-1.5 select-none font-medium">
        {message.senderName} • {message.time}
      </span>

      <div
        className={cn(
          'p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs relative border font-medium select-text',
          isMe
            ? 'bg-app-black text-white dark:bg-white dark:text-app-black border-app-black dark:border-white rounded-tr-sm'
            : 'bg-[#FCFCFC] text-app-black dark:bg-zinc-900 dark:text-zinc-100 border-[#ECECEC] dark:border-zinc-800 rounded-tl-sm'
        )}
      >
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}

        {message.img && (
          <div className="rounded-xl overflow-hidden mt-1.5 border border-app-border dark:border-zinc-800">
            <img src={message.img} alt="attachment" className="max-w-full max-h-48 object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        {message.audioDur && (
          <div className="flex items-center gap-3 py-1 font-semibold text-xs select-none">
            <button className="w-8 h-8 rounded-full bg-[#E27D60]/10 text-[#E27D60] flex items-center justify-center cursor-pointer shrink-0">
              <Volume2 className="w-4 h-4" />
            </button>
            <div>
              <div className="flex gap-0.5 items-end h-4 w-28">
                {[2, 4, 3, 5, 2, 6, 4, 7, 3, 5, 4, 2].map((h, i) => (
                  <span key={i} className="bg-[#E27D60] dark:bg-[#E27D60] w-[2px] rounded-full" style={{ height: `${h * 2}px` }} />
                ))}
              </div>
              <p className="text-[9px] text-app-gray dark:text-zinc-400 mt-0.5">Voice Note • {message.audioDur}</p>
            </div>
          </div>
        )}

        {message.file && (
          <div className="flex items-center gap-2.5 py-1 text-xs select-none">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate text-app-black dark:text-zinc-200">{message.file.name}</p>
              <p className="text-[9px] text-app-gray dark:text-zinc-500">{message.file.size}</p>
            </div>
          </div>
        )}
      </div>

      {isMe && (
        <span className="text-[9px] text-app-gray dark:text-zinc-500 mt-1 flex items-center gap-1 select-none font-bold">
          <span>Sent</span>
          <CheckCheck className="w-3 h-3 text-[#E27D60]" />
        </span>
      )}
    </div>
  );
};
