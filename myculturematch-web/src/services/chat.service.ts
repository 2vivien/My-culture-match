import { Conversation, ChatMessage } from '../types/chat.types';
import chatMock from '@/src/mocks/chat.json';

export const mockConversations = chatMock.conversations as Conversation[];
export const initialMessages = chatMock.initialMessages as Record<string, ChatMessage[]>;

export const getAutomatedReply = (partnerName: string, textInput: string): { reply: string; afterMs: number } => {
  const norm = textInput.toLowerCase();
  let reply = '';
  
  if (norm.includes('hello') || norm.includes('hi') || norm.includes('hey') || norm.includes('salut')) {
    reply = `Greetings from the heart of our homeland! It is beautiful to connect. What traditions are on your mind today? 🌍`;
  } else if (norm.includes('culture') || norm.includes('tradition') || norm.includes('country')) {
    reply = `Our heritage defines us. I would love to tell you more about our rituals, local instruments, and how our elders passed these down. Tell me about yours too!`;
  } else if (norm.includes('music') || norm.includes('song') || norm.includes('drum') || norm.includes('synth')) {
    reply = `Sound travels beyond borders! Music is the ultimate bridge of MyCultureMatch. Let's create an intercultural playlist together sometime! 🎵`;
  } else {
    reply = `That is fascinating! Connecting with you gives me a whole new perspective on world connections. Let's keep sharing these premium moments of cultural synergy.`;
  }

  return {
    reply,
    afterMs: 2500
  };
};
