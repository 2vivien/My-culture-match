import { Conversation, ChatMessage } from '../types/chat.types';

export const mockConversations: Conversation[] = [
  {
    id: 'c-1',
    name: 'Stevian Yuki',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    culture: 'Traditional Shintoism × Cyber-Neon',
    lang: 'Japanese (Native), English (Fluent)',
    online: true,
    lastMsg: 'Have you tried the ritual matcha from Shizuoka?',
    timeAgo: 'Just now',
    unreadCount: 2,
    glow: 'violet',
    level: 42,
    bio: 'Tokyo explorer uniting ancestral tea ceremonies with digital synthesizers. Seeking language exchange with Mediterranean souls!',
    country: 'Japan 🇯🇵',
    traditions: ['Ancestral Tea Ceremonies', 'Kintsugi Pottery restoration', 'Taiko drumming rhythms'],
    tribes: ['Origami Masters', 'Matcha Tea Lovers', 'Synthwave Ninjas'],
    sharedMedia: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=150&q=80'
    ]
  },
  {
    id: 'c-2',
    name: 'Jumana Al-Fassi',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    culture: 'Andalusian Gardens × Berber Silversmithing',
    lang: 'Arabic (Native), French (Fluent), Spanish',
    online: true,
    lastMsg: 'The spice maps here in Marrakech are thousands of years old.',
    timeAgo: '2m ago',
    unreadCount: 0,
    glow: 'turquoise',
    level: 31,
    bio: 'Marrakech native preserving Berber artisan metal weaving techniques and spice blending secrets. Always brewing dynamic mint tea!',
    country: 'Morocco 🇲🇦',
    traditions: ['Argan seed extraction', 'Andalusian lute playing', 'Zellige mosaic formulation'],
    tribes: ['Sahara Nomads', 'Tajine Connoisseurs', 'Lute Musicians'],
    sharedMedia: [
      'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1481975472121-125015b63004?auto=format&fit=crop&w=150&q=80'
    ]
  },
  {
    id: 'c-3',
    name: 'Halean Storm',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    culture: 'Viking Runes × Rio Samba',
    lang: 'Swedish (Native), Portuguese (Fluent)',
    online: false,
    lastSeen: '1h ago',
    lastMsg: '🎙️ Voice Note (0:42) - Scandinavian chants',
    timeAgo: '1h ago',
    unreadCount: 0,
    glow: 'sunset',
    level: 19,
    bio: 'Stockholm musician researching acoustic overlaps in Brazilian Capoeira and Nordic traditional jaw-harps. Polar light worshipper.',
    country: 'Sweden 🇸🇪',
    traditions: ['Nordic Runology exploration', 'Midsummer solstice chants', 'Foraging local wild cloudberries'],
    tribes: ['Eco Warriors', 'Capoeira Choral', 'Polar Explorers'],
    sharedMedia: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=150&q=80'
    ]
  },
  {
    id: 'c-4',
    name: 'Fatimah Diop',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=150&q=80',
    culture: 'Griot Lore × Wolof Rhythm Dynamics',
    lang: 'Wolof (Native), French (Native), English',
    online: true,
    lastMsg: '📁 Dakar_Sabar_Rhythms.mp3 (3.4 MB)',
    timeAgo: '3h ago',
    unreadCount: 0,
    glow: 'citrus',
    level: 27,
    bio: 'Dakar Griot guardian bringing storytelling loops into modern digital ambient architecture. Passionate about Teranga hospitality!',
    country: 'Senegal 🇸🇳',
    traditions: ['Sabar drum rhythm metrics', 'Senegalese traditional indigo dyeing', 'Griot historical recitation'],
    tribes: ['Sabar Drummers', 'Teranga Hosts', 'Indigo Artists'],
    sharedMedia: [
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=150&q=80',
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=150&q=80'
    ]
  }
];

export const initialMessages: Record<string, ChatMessage[]> = {
  'c-1': [
    { id: '1', senderId: 'c-1', senderName: 'Stevian Yuki', text: 'Konnichiwa! I hope your day is filled with great tea and peaceful rhythms. 😄', time: '10:15 AM' },
    { id: '2', senderId: 'me', senderName: 'Me', text: 'Konnichiwa Stevian! I was reading about your Shinto-Synth music, it is incredibly mesmerizing!', time: '10:17 AM' },
    { id: '3', senderId: 'c-1', senderName: 'Stevian Yuki', text: 'Arigato! I integrate deep synthesizer leads with sacred temple flutes. It symbolizes the bridge of future and past.', time: '10:19 AM' },
    { id: '4', senderId: 'c-1', senderName: 'Stevian Yuki', text: 'Have you tried the ritual matcha from Shizuoka?', time: '10:20 AM' }
  ],
  'c-2': [
    { id: '1', senderId: 'me', senderName: 'Me', text: 'Jumana, your Berber silversmithing collection is beautiful. How long does a single piece take?', time: 'Yesterday' },
    { id: '2', senderId: 'c-2', senderName: 'Jumana Al-Fassi', text: 'Marhaban my friend! A woven neckpiece can take up to 40 hours of absolute focus.', time: 'Yesterday' },
    { id: '3', senderId: 'c-2', senderName: 'Jumana Al-Fassi', text: 'The spice maps here in Marrakech are thousands of years old.', time: 'Yesterday' }
  ],
  'c-3': [
    { id: '1', senderId: 'c-3', senderName: 'Halean Storm', text: 'Hallå! I recorded some acoustic tests combining Nordic overtone singing with Bahia rhythms.', time: '2 days ago' },
    { id: '2', senderId: 'me', senderName: 'Me', text: 'That sounds magical, send a sample over when you can!', time: '2 days ago' },
    { id: '3', senderId: 'c-3', senderName: 'Halean Storm', audioDur: '0:42', time: '1h ago' }
  ],
  'c-4': [
    { id: '1', senderId: 'me', senderName: 'Me', text: 'Hi Fatimah! Can you send me the Wolof drum patterns we discussed earlier?', time: '3h ago' },
    { id: '2', senderId: 'c-4', senderName: 'Fatimah Diop', text: 'Of course! Here is the Sabar template I promised.', time: '3h ago' },
    { id: '3', senderId: 'c-4', senderName: 'Fatimah Diop', file: { name: 'Dakar_Sabar_Rhythms.mp3', size: '3.4 MB' }, time: '3h ago' }
  ]
};

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
