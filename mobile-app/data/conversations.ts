export type ConversationMode = 'love' | 'friendship';

export const MATCHES = [
  {
    id: '1',
    name: 'Sophia',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    hasStory: true,
    isOnline: false,
    mode: 'love' as ConversationMode
  },
  {
    id: '2',
    name: 'Harper',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    hasStory: false,
    isOnline: true,
    mode: 'friendship' as ConversationMode
  },
  {
    id: '3',
    name: 'Evelyn',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    hasStory: false,
    isOnline: true,
    mode: 'love' as ConversationMode
  },
  {
    id: '4',
    name: 'Abigail',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    hasStory: false,
    isOnline: false,
    mode: 'friendship' as ConversationMode
  },
  {
    id: '5',
    name: 'Ava',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
    hasStory: false,
    isOnline: false,
    mode: 'love' as ConversationMode
  },
  {
    id: '6',
    name: 'Isabella',
    image: 'https://images.unsplash.com/photo-1517070208541-6ddc4d3efbcb?w=200',
    hasStory: true,
    isOnline: true,
    mode: 'friendship' as ConversationMode
  },
];

export const MESSAGES = [
  {
    id: '1',
    name: 'Harper',
    message: "What's the most exciting thi...",
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    time: '15 min ago',
    isUnread: false,
    isActive: false,
    isStarred: true,
    mode: 'friendship' as ConversationMode
  },
  {
    id: '2',
    name: 'Evelyn',
    message: "What's the most exciti...",
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    time: '1 min ago',
    isUnread: true,
    isActive: false,
    isStarred: true,
    mode: 'love' as ConversationMode
  },
  {
    id: '3',
    name: 'Abigail',
    message: 'if you could travel anywhere right now, where would it be',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    time: 'Now',
    isUnread: true,
    isActive: true,
    unreadCount: 4,
    mode: 'friendship' as ConversationMode
  },
  {
    id: '4',
    name: 'Mia',
    message: 'Hey! How are you doing today?',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
    time: '2h ago',
    isUnread: false,
    isActive: false,
    isStarred: false,
    mode: 'love' as ConversationMode
  },
  {
    id: '5',
    name: 'Luna',
    message: 'The weather is so nice!',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    time: '5h ago',
    isUnread: false,
    isActive: false,
    isStarred: false,
    mode: 'friendship' as ConversationMode
  },
];
