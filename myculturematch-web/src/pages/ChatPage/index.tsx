import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockConversations, initialMessages, getAutomatedReply } from '@/src/services/chat.service';
import { ConversationsListColumn } from '@/src/components/chat/ConversationsListColumn';
import { ActiveChatColumn } from '@/src/components/chat/ActiveChatColumn';
import { CulturalProfileColumn } from '@/src/components/chat/CulturalProfileColumn';
import { ChatMessage } from '@/src/types/chat.types';

export const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeId, setActiveId] = useState(mockConversations[0].id);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];
  const activeMessages = messagesMap[activeId] || [];

  const handleSendMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: 'Me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMessage],
    }));

    // Update conversation last message and reset unread if active
    setConversations((prevList) =>
      prevList.map((c) =>
        c.id === activeId ? { ...c, lastMsg: text, timeAgo: 'Just now' } : c
      )
    );

    // Trigger automated response
    const { reply, afterMs } = getAutomatedReply(activeConversation.name, text);
    setTimeout(() => {
      const responseMessage: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        senderId: activeConversation.id,
        senderName: activeConversation.name,
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), responseMessage],
      }));

      setConversations((prevList) =>
        prevList.map((c) =>
          c.id === activeId ? { ...c, lastMsg: reply, timeAgo: 'Just now' } : c
        )
      );
    }, afterMs);
  };

  // Reset unread count when clicking conversation
  useEffect(() => {
    setConversations((prevList) =>
      prevList.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeId]);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setMobileView('chat');
  };

  return (
    <div className="flex-1 flex gap-4 md:gap-6 h-full min-h-0 overflow-hidden pt-2">
      {/* Column 1: Conversations List */}
      <div className={`${mobileView === 'list' ? 'flex w-full md:w-auto h-full min-w-0' : 'hidden md:flex h-full shrink-0'}`}>
        <ConversationsListColumn
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Column 2: Active Conversation */}
      <div className={`${mobileView === 'chat' ? 'flex flex-1 h-full min-w-0' : 'hidden md:flex md:flex-1 h-full'}`}>
        <ActiveChatColumn
          partner={activeConversation}
          messages={activeMessages}
          onSendMessage={handleSendMessage}
          isProfileOpen={isProfileOpen}
          onToggleProfile={() => setIsProfileOpen((p) => !p)}
          onBack={() => setMobileView('list')}
        />
      </div>

      {/* Column 3: Expandable Cultural Profile details */}
      <AnimatePresence mode="wait">
        {isProfileOpen && (
          <motion.div
            key={activeId}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="hidden lg:block h-full shrink-0"
          >
            <CulturalProfileColumn
              partner={activeConversation}
              onClose={() => setIsProfileOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
