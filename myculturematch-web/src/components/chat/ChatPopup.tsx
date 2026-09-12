import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Maximize2, Square, PenSquare } from 'lucide-react';
import { chatService } from '@/src/services/chat.service';
import { ActiveChatColumn } from './ActiveChatColumn';
import { ConversationListItem } from './ConversationListItem';
import { Conversation, ChatMessage } from '@/src/types/chat.types';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { cn } from '@/src/lib/utils';

type Tab = 'messages' | 'profils';

/**
 * Messagerie — panneau à la Instagram : header "Messages" avec bouton
 * d'agrandissement (↗) et nouveau message (✏️), liste compacte d'aperçus.
 * S'agrandit en colonne de chat pleine hauteur au clic sur ↗.
 */
export const ChatPopup: React.FC = () => {
  const { isChatOpen, closeChat } = useUIStore();
  const meId = useAppStore((s) => s.currentUser.id);
  const popupRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>('messages');
  const [expanded, setExpanded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [search, setSearch] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);

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
    try {
      const msgs = await chatService.getMessages(conversationId);
      // Le bubble marque "mien" via senderId === 'me' : on normalise avec le vrai id.
      const normalized = msgs.map((m) =>
        m.senderId === meId ? { ...m, senderId: 'me' } : m,
      );
      setMessagesMap((prev) => ({ ...prev, [conversationId]: normalized }));
      // Marque la conversation comme lue côté backend (reset unread).
      chatService.markRead(conversationId);
    } catch {
      // Silently handle — messages stay empty
    }
  }, [meId]);

  const openConversation = useCallback((id: string) => {
    setActiveId(id);
    setTab('messages');
    if (!expanded) setExpanded(true);
    if (!messagesMap[id]) loadMessages(id);
  }, [expanded, messagesMap, loadMessages]);

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
        [activeId]: [
          ...(prev[activeId] || []).filter((m) => m.id !== optimisticMsg.id),
          { ...sentMsg, senderId: 'me' },
        ],
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

  const sizeClasses = expanded
    ? 'w-[min(600px,calc(100vw-1.5rem))] h-[min(780px,calc(100dvh-1.5rem))]'
    : 'w-[min(460px,calc(100vw-1.5rem))] h-[min(660px,calc(100dvh-1.5rem))]';

  return isChatOpen ? (
        <div
          ref={popupRef}
          className={cn(
            'fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-800 rounded-[24px] shadow-2xl flex flex-col overflow-hidden select-none',
            sizeClasses,
          )}
        >
          {/* Header à la Instagram : titre + actions */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <h2 className="font-black text-lg text-app-black dark:text-zinc-100 flex items-center gap-2">
              Messages
              {totalUnread > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#E27D60] text-[10px] text-white font-bold flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1.5">
              {activeConversation && (
                <button
                  onClick={() => { setActiveId(null); setExpanded(false); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer bg-transparent border-none"
                  title={expanded ? 'Réduire' : 'Retour'}
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer bg-transparent border-none"
                title={expanded ? 'Réduire' : 'Agrandir'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer bg-transparent border-none"
                title="Fermer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Corps */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {tab === 'messages' && (
              activeConversation ? (
                <ActiveChatColumn
                  partner={activeConversation}
                  messages={activeMessages}
                  onSendMessage={handleSendMessage}
                  onBack={() => { setActiveId(null); setExpanded(false); }}
                />
              ) : (
                <div className="flex flex-col h-full">
                  {/* Recherche + nouveau message */}
                  <div className="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-app-gray" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-app-border/60 dark:border-zinc-800 rounded-full py-2.5 pl-10 pr-4 text-sm text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none focus:ring-1 focus:ring-[#E27D60]/40 transition-all font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('profils')}
                      title="Nouveau message"
                      className="w-9 h-9 rounded-full bg-[#E27D60] hover:bg-[#c66b50] text-white flex items-center justify-center shrink-0 transition-all hover:scale-105 cursor-pointer border-none"
                    >
                      <PenSquare className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-2 pb-3 hide-scrollbar">
                    {loadingConversations ? (
                      <div className="text-center py-10 text-sm text-app-gray">Chargement...</div>
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
                      <div className="text-center py-10 text-sm text-app-gray">
                        Aucune conversation trouvée.
                      </div>
                    )}
                  </div>

                </div>
              )
            )}

            {tab === 'profils' && (
              <ProfilesTab conversations={conversations} onMessage={openConversation} onBack={() => setTab('messages')} />
            )}
          </div>
        </div>
  ) : null;
};

const ProfilesTab: React.FC<{ conversations: Conversation[]; onMessage: (id: string) => void; onBack: () => void }> = ({
  conversations,
  onMessage,
  onBack,
}) => {
  const [query, setQuery] = useState('');

  const filtered = conversations.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.country.toLowerCase().includes(query.toLowerCase()) ||
    p.culture.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
          title="Retour"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-app-gray" />
          <input
            type="text"
            placeholder="Rechercher un profil..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-app-border/60 dark:border-zinc-800 rounded-full py-2.5 pl-10 pr-4 text-sm text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none focus:ring-1 focus:ring-[#E27D60]/40 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1 hide-scrollbar">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="relative shrink-0">
                <TotemAvatar src={p.avatar} alt={p.name} size="md" glow={p.glow as any} level={p.level} />
                {p.online && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-app-black dark:text-zinc-100 truncate">{p.name}</span>
                  <span className="text-xs font-bold text-[#E27D60] shrink-0">{p.country.split(' ')[0]}</span>
                </div>
                <p className="text-xs text-app-gray truncate leading-tight">{p.culture}</p>
                <p className="text-xs text-app-gray/80 line-clamp-2 leading-snug mt-0.5">{p.bio}</p>
              </div>
              <button
                type="button"
                onClick={() => onMessage(p.id)}
                className="shrink-0 px-4 py-2 rounded-full bg-[#E27D60] text-white text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer border-none"
              >
                Message
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-sm text-app-gray">
            Aucun profil trouvé.
          </div>
        )}
      </div>
    </div>
  );
};
