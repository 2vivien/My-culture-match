import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Users, Search } from 'lucide-react';
import { chatService } from '@/src/services/chat.service';
import { ActiveChatColumn } from './ActiveChatColumn';
import { ConversationListItem } from './ConversationListItem';
import { Conversation, ChatMessage } from '@/src/types/chat.types';
import { useUIStore } from '@/src/stores/useUIStore';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { cn } from '@/src/lib/utils';

type Tab = 'messages' | 'profils';

export const ChatPopup: React.FC = () => {
  const { isChatOpen, closeChat } = useUIStore();
  const popupRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [search, setSearch] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const activeMessages = activeId ? messagesMap[activeId] || [] : [];
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        closeChat();
      }
    };
    if (isChatOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isChatOpen, closeChat]);

  useEffect(() => {
    if (!isChatOpen) return;
    setLoadingConversations(true);
    chatService.getConversations()
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoadingConversations(false));
  }, [isChatOpen]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (messagesMap[conversationId]) return;
    setLoadingMessages(true);
    try {
      const msgs = await chatService.getMessages(conversationId);
      setMessagesMap((prev) => ({ ...prev, [conversationId]: msgs }));
    } catch {
      // Silently handle — messages stay empty
    } finally {
      setLoadingMessages(false);
    }
  }, [messagesMap]);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setTab('messages');
    loadMessages(id);
  }, [loadMessages]);

  useEffect(() => {
    if (activeId) {
      setConversations((prevList) =>
        prevList.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
      );
    }
  }, [activeId]);

  const handleSendMessage = async (text: string) => {
    if (!activeId) return;

    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: 'Moi',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), optimisticMsg],
    }));

    setConversations((prevList) =>
      prevList.map((c) =>
        c.id === activeId ? { ...c, lastMsg: text, timeAgo: 'Just now' } : c
      )
    );

    try {
      const sentMsg = await chatService.sendMessage(activeId, text);
      setMessagesMap((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []).filter((m) => m.id !== optimisticMsg.id), sentMsg],
      }));
    } catch {
      // Keep optimistic message — real messages will sync on next fetch
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    c.tribes.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const renderTabBar = (
    <div className="shrink-0 flex gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mx-4 mt-3 select-none">
      <button
        type="button"
        onClick={() => setTab('messages')}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
          tab === 'messages'
            ? 'bg-white dark:bg-zinc-800 text-app-black dark:text-white shadow-sm'
            : 'text-app-gray hover:text-app-black dark:hover:text-white'
        )}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Messages
        {totalUnread > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#E27D60] text-[9px] text-white font-bold flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => setTab('profils')}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
          tab === 'profils'
            ? 'bg-white dark:bg-zinc-800 text-app-black dark:text-white shadow-sm'
            : 'text-app-gray hover:text-app-black dark:hover:text-white'
        )}
      >
        <Users className="w-3.5 h-3.5" />
        Profils
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 w-[min(400px,calc(100vw-1.5rem))] h-[min(560px,calc(100dvh-1.5rem))] bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-800 rounded-[24px] shadow-2xl flex flex-col overflow-hidden select-none"
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div>
              <h2 className="font-bold text-base text-app-black dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#E27D60]" />
                Messagerie
              </h2>
              <p className="text-[11px] text-app-gray dark:text-zinc-500">Culture Matchmaking Room</p>
            </div>
            <button
              onClick={closeChat}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {renderTabBar}

          {/* Body */}
          <div className="flex-1 min-h-0 p-4 overflow-hidden">
            {tab === 'messages' && (
              activeConversation ? (
                <ActiveChatColumn
                  partner={activeConversation}
                  messages={activeMessages}
                  onSendMessage={handleSendMessage}
                  onBack={() => setActiveId(null)}
                />
              ) : (
                <div className="flex flex-col h-full">
                  <div className="relative mb-3 shrink-0">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-app-gray" />
                    <input
                      type="text"
                      placeholder="Rechercher une conversation..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-[#FEFEFE] dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-2xl py-2 pl-9 pr-4 text-xs text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none focus:ring-1 focus:ring-[#E27D60] focus:border-[#E27D60] transition-all font-medium"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 hide-scrollbar">
                    {loadingConversations ? (
                      <div className="text-center py-10 text-xs text-app-gray">Chargement...</div>
                    ) : filteredConversations.length > 0 ? (
                      filteredConversations.map((c) => (
                        <ConversationListItem
                          key={c.id}
                          conversation={c}
                          isActive={c.id === activeId}
                          onClick={() => openConversation(c.id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 text-xs text-app-gray">
                        Aucune conversation trouvée.
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {tab === 'profils' && (
              <ProfilesTab conversations={conversations} onMessage={openConversation} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProfilesTab: React.FC<{ conversations: Conversation[]; onMessage: (id: string) => void }> = ({
  conversations,
  onMessage,
}) => {
  const [query, setQuery] = useState('');

  const filtered = conversations.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.country.toLowerCase().includes(query.toLowerCase()) ||
    p.culture.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-app-gray" />
        <input
          type="text"
          placeholder="Rechercher un profil..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#FEFEFE] dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-2xl py-2 pl-9 pr-4 text-xs text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none focus:ring-1 focus:ring-[#E27D60] focus:border-[#E27D60] transition-all font-medium"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 hide-scrollbar">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-2xl border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#E27D60]/50 transition-colors"
            >
              <div className="relative shrink-0">
                <TotemAvatar src={p.avatar} alt={p.name} size="sm" glow={p.glow as any} level={p.level} />
                {p.online && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-app-black dark:text-zinc-100 truncate">{p.name}</span>
                  <span className="text-[10px] font-bold text-[#E27D60] shrink-0">{p.country.split(' ')[0]}</span>
                </div>
                <p className="text-[11px] text-app-gray truncate leading-tight">{p.culture}</p>
                <p className="text-[11px] text-app-gray/80 line-clamp-2 leading-snug mt-0.5">{p.bio}</p>
              </div>
              <button
                type="button"
                onClick={() => onMessage(p.id)}
                className="shrink-0 px-3 py-2 rounded-xl bg-[#E27D60] text-white text-[11px] font-bold hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer"
              >
                Message
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-xs text-app-gray">
            Aucun profil trouvé.
          </div>
        )}
      </div>
    </div>
  );
};
