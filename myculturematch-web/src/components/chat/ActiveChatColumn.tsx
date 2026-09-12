import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, Smile, Paperclip, Mic, Send, ArrowLeft } from 'lucide-react';
import { Conversation, ChatMessage } from '@/src/types/chat.types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { AssistantPanel } from './AssistantPanel';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';

interface ActiveChatProps {
  partner: Conversation;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onBack?: () => void;
}

export const ActiveChatColumn: React.FC<ActiveChatProps> = ({
  partner,
  messages,
  onSendMessage,
  onBack,
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [lyraOpen, setLyraOpen] = useState(false);
  const [lyraContext, setLyraContext] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages.length > 0 ? messages[messages.length - 1]?.text : undefined;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend(e);
    }
  };

  return (
    <div className="flex-1 border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[24px] flex flex-col h-full select-none shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-app-border dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full border border-app-border dark:border-zinc-800/80 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors mr-1 cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="relative">
            <TotemAvatar
              src={partner.avatar}
              alt={partner.name}
              size="md"
              glow={partner.glow as any}
              level={partner.level}
            />
            {partner.online && (
              <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950 z-10" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-app-black dark:text-zinc-100 flex items-center gap-2">
              {partner.name}
              <span className="text-[10px] uppercase font-bold text-app-gray tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {partner.country.split(' ')[0]} Match
              </span>
            </h3>
            <p className="text-xs text-app-gray truncate max-w-[200px] sm:max-w-[300px] leading-snug">
              {partner.culture} • <span className="text-[#E27D60] dark:text-[#E27D60] font-semibold">{partner.lang.split(' ')[0]}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <button className="w-9 h-9 border border-app-border dark:border-zinc-800 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
            <Phone className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 border border-app-border dark:border-zinc-800 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#FEFEFE] dark:bg-zinc-950/40 hide-scrollbar flex flex-col">

        {messages.map((m) => (
          <ChatMessageBubble
            key={m.id}
            message={m}
            onAskLyra={(msg) => { setLyraContext(msg); setLyraOpen(true); }}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2 bg-[#FCFCFC] dark:bg-zinc-900 border border-[#ECECEC] dark:border-zinc-800 rounded-2xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#E27D60] focus-within:border-[#E27D60] transition-all">
          <button type="button" className="text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer p-1">
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder={`Say customized culture greeting to ${partner.name.split(' ')[0]}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent text-sm text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none font-medium h-8"
          />

          <button type="button" className="text-app-gray hover:text-amber-500 cursor-pointer p-1">
            <Smile className="w-4 h-4" />
          </button>
          <AssistantPanel
            partner={partner}
            lastMessage={lyraContext?.text ?? lastMessage}
            onPick={(suggestion) => {
              // Envoi direct de la suggestion sélectionnée + focus sur la saisie.
              const text = suggestion.trim();
              if (text) onSendMessage(text);
              setInput('');
              setLyraOpen(false);
              setLyraContext(null);
              inputRef.current?.focus();
            }}
            open={lyraOpen}
            onOpenChange={setLyraOpen}
          />
          <button type="button" className="text-app-gray hover:text-[#E27D60] cursor-pointer p-1">
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-8 h-8 rounded-xl bg-[#E27D60] hover:bg-[#c66b50] text-white flex items-center justify-center hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all cursor-pointer shrink-0 ml-1"
          >
            <Send className="w-3.5 h-3.5 ml-0.5 text-white dark:text-app-black" />
          </button>
        </div>
      </form>
    </div>
  );
};
