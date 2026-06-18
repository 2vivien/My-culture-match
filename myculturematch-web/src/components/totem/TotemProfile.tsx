import { useState } from 'react';
import { motion as framerMotion, AnimatePresence as framerAnimatePresence } from 'framer-motion';
import { 
  Palette, Music, Utensils, Landmark, Sparkles, MapPin, Award, BookOpen, Users, Compass, Globe, 
  MoreHorizontal, Plus, MessageSquare, Facebook, Twitter, Instagram, Youtube, Twitch, Gamepad2, Play,
  UserPlus, Image, FileText, Heart, Share2, ChevronLeft, ChevronRight, MessageCircle, Home, Layers, Settings
} from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { userService } from '@/src/services/userService';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { getTotemTitle } from '@/src/types/user';
import coverImg from '@/assets/cover.jpeg';

export const TotemProfile = () => {
  const { selectedTotemUserId } = useAppStore();
  const user = userService.getUserById(selectedTotemUserId);
  const [activeTab, setActiveTab] = useState<'Home' | 'Journal' | 'Timeline' | 'Connexions' | 'Photos' | 'Traditions' | 'Messages' | 'Settings'>('Timeline');

  // Country code helper for flagcdn
  const getCountryCode = (location: string) => {
    const loc = location.toLowerCase();
    if (loc.includes('benin')) return 'bj';
    if (loc.includes('zealand')) return 'nz';
    if (loc.includes('senegal')) return 'sn';
    if (loc.includes('ethiopia')) return 'et';
    if (loc.includes('mexico')) return 'mx';
    if (loc.includes('japan')) return 'jp';
    if (loc.includes('france')) return 'fr';
    if (loc.includes('jordan')) return 'jo';
    if (loc.includes('morocco')) return 'ma';
    if (loc.includes('brazil')) return 'br';
    return 'us';
  };

  const profileTabs = [
    { id: 'Home', icon: Home, label: 'Profile' },
    { id: 'Journal', icon: BookOpen, label: 'Journal' },
    { id: 'Timeline', icon: Layers, label: 'Timeline' },
    { id: 'Connexions', icon: Users, label: 'Connexions' },
    { id: 'Photos', icon: Image, label: 'Photos' },
    { id: 'Traditions', icon: Award, label: 'Traditions' },
    { id: 'Messages', icon: MessageSquare, label: 'Messages' },
    { id: 'Settings', icon: Settings, label: 'Settings' }
  ] as const;

  // Mock data for dynamic tabs
  const traditionsMock = [
    { title: 'Keeper of Fire', desc: 'Participated in 5 tribal storytelling sessions', difficulty: 'Rare', progress: 100 },
    { title: 'Culinary Ambassador', desc: 'Shared 3 traditional recipes with the global feed', difficulty: 'Epic', progress: 80 },
    { title: 'Tribe Connector', desc: 'Connected with members from 3 different countries', difficulty: 'Legendary', progress: 60 },
  ];

  const connexionsMock = [
    { name: 'Nick Grissom', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80', role: '3D Artist', level: 45, online: true },
    { name: 'Matt Parker', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80', role: 'Unity Dev', level: 32, online: true },
    { name: 'Neko Bebop', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', role: 'Streamer', level: 27, online: false },
    { name: 'Bearded Wonder', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=80&q=80', role: 'Retro Gamer', level: 50, online: true },
  ];

  return (
    <framerMotion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar max-w-[1200px] mx-auto w-full gap-6 pb-20"
      style={{
        '--color-primary': '#6c63fc',
        '--color-primary-dark': '#5a52e0',
        '--color-secondary': '#2dd9d9',
        '--gradient-btn-primary': 'linear-gradient(135deg, #8b7af9 0%, #6c63fc 100%)',
        '--gradient-btn-secondary': 'linear-gradient(135deg, #34e0e0 0%, #1fc8cf 100%)',
      } as any}
    >
      <div className="bg-white dark:bg-[#1c212e] rounded-[24px] shadow-sm flex flex-col relative mt-2">
        <div className="h-[220px] w-full rounded-t-[24px] overflow-hidden relative">
          <img src={coverImg} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        <div className="absolute top-[150px] left-1/2 -translate-x-1/2 z-10">
          <TotemAvatar 
            size="xl" 
            src={user.avatar} 
            level={user.level} 
            glow="turquoise" 
            className="drop-shadow-xl"
          />
        </div>

        <div className="pt-[80px] pb-8 px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center text-center lg:text-left">
          <div className="flex justify-center lg:justify-start items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#2e3552] dark:text-white">930</span>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#2e3552] dark:text-white">82</span>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Connexions</span>
            </div>
            <div className="flex flex-col items-center ml-4">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm mb-1">
                <img 
                  src={`https://flagcdn.com/${getCountryCode(user.location)}.svg`} 
                  alt={user.location} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">{user.location.split(' - ')[0] || user.location}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-black text-[#2e3552] dark:text-white">{user.name}</h1>
            <span className="text-[#2dd9d9] font-bold text-sm mt-1">@{user.name.toLowerCase()}</span>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4">
            <div className="flex gap-3">
              <button 
                className="w-12 h-12 rounded-xl text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-md cursor-pointer"
                style={{ background: 'var(--gradient-btn-primary)' }}
                title="Add Friend"
              >
                <UserPlus className="w-5 h-5" />
              </button>
              <button 
                className="w-12 h-12 rounded-xl text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-md cursor-pointer"
                style={{ background: 'var(--gradient-btn-secondary)' }}
                title="Send Message"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-[#3b5998] text-white flex items-center justify-center hover:scale-110 transition-transform"><Facebook className="w-4 h-4 fill-current" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1da1f2] text-white flex items-center justify-center hover:scale-110 transition-transform"><Twitter className="w-4 h-4 fill-current" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#e1306c] text-white flex items-center justify-center hover:scale-110 transition-transform"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#7b5cf0] text-white flex items-center justify-center hover:scale-110 transition-transform"><Twitch className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm px-4 flex justify-between items-center h-[60px] overflow-hidden">
        <button className="text-[#9aa3b8] hover:text-[#2e3552] dark:hover:text-white p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex h-full items-center flex-1 justify-center gap-1 sm:gap-4 overflow-x-auto hide-scrollbar">
          {profileTabs.map((tab, idx) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="flex h-full items-center">
                {idx > 0 && <div className="h-6 w-[1px] bg-gray-200 dark:bg-zinc-800 mx-1 sm:mx-2" />}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-full px-3 sm:px-4 flex items-center transition-colors group cursor-pointer ${
                    isActive ? 'text-[#2e3552] dark:text-white' : 'text-[#9aa3b8] hover:text-[#2e3552] dark:hover:text-white'
                  }`}
                  title={tab.label}
                >
                  <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {isActive && (
                    <framerMotion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2dd9d9] rounded-t-full" 
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <button className="text-[#9aa3b8] hover:text-[#2e3552] dark:hover:text-white p-1">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#2e3552] dark:text-white">About Me</h3>
              <MoreHorizontal className="w-5 h-5 text-[#9aa3b8] cursor-pointer" />
            </div>
            <p className="text-sm text-[#9aa3b8] mb-6 leading-relaxed">
              Hi! I'm {user.name}, a passionate gamer and culture explorer. I love discovering ancestral traditions and connecting with people globally!
            </p>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9aa3b8] font-bold">City</span>
                <span className="font-bold text-[#2e3552] dark:text-white">{user.location.split(' - ')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9aa3b8] font-bold">Country</span>
                <span className="font-bold text-[#2e3552] dark:text-white">{user.location.split(' - ')[1] || user.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9aa3b8] font-bold">Age</span>
                <span className="font-bold text-[#2e3552] dark:text-white">24 Years</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <framerAnimatePresence mode="wait">
            {activeTab === 'Timeline' && (
              <framerMotion.div
                key="timeline"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-white dark:bg-[#1c212e] rounded-[20px] shadow-sm p-6 border border-gray-100 dark:border-zinc-800">
                  <div className="flex gap-4 items-center mb-4">
                    <TotemAvatar size="md" src={user.avatar} glow="turquoise" />
                    <div>
                      <h4 className="font-bold text-[#2e3552] dark:text-white text-sm">{user.name}</h4>
                      <p className="text-xs text-[#9aa3b8]">5 hours ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#2e3552] dark:text-white mb-4">
                    Just finished setting up my new streaming room! What do you guys think? 🎮✨
                  </p>
                  <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 h-80 relative group shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&w=800&q=80" 
                      alt="Streaming room setup" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-[#1c212e]/85 backdrop-blur-md border border-white/10 rounded-xl p-3 flex justify-between items-center text-white shadow-lg">
                      <div className="flex gap-3 items-center">
                        <TotemAvatar size="sm" src={user.avatar} glow="none" className="border border-white/20 shadow-lg" />
                        <div className="flex flex-col">
                          <span className="text-xs font-black">GameHuntress on Twitch</span>
                          <span className="text-[10px] text-zinc-300">Watch the streaming setup review live</span>
                        </div>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-[#2dd9d9] text-white flex items-center justify-center hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-4 mt-4 text-xs font-bold text-[#9aa3b8]">
                    <div className="flex gap-6">
                      <button className="flex items-center gap-2 hover:text-red-500 transition-colors cursor-pointer">
                        <Heart className="w-4.5 h-4.5 text-red-500 fill-current" /> <span>122 Likes</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-[#2dd9d9] transition-colors cursor-pointer">
                        <MessageCircle className="w-4.5 h-4.5" /> <span>24 Comments</span>
                      </button>
                    </div>
                    <button className="flex items-center gap-2 hover:text-[#6c63fc] transition-colors cursor-pointer">
                      <Share2 className="w-4.5 h-4.5" /> <span>15 Shares</span>
                    </button>
                  </div>
                </div>
              </framerMotion.div>
            )}

            {activeTab === 'Connexions' && (
              <framerMotion.div
                key="connexions"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6"
              >
                <h3 className="font-bold text-[#2e3552] dark:text-white mb-4">Active Connexions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {connexionsMock.map((conn, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <TotemAvatar size="sm" src={conn.avatar} level={conn.level} statusDot={conn.online ? 'online' : 'none'} />
                        <div>
                          <h4 className="font-bold text-xs text-[#2e3552] dark:text-white">{conn.name}</h4>
                          <p className="text-[10px] text-[#9aa3b8]">{conn.role}</p>
                        </div>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${conn.online ? 'bg-[#3ddc84]' : 'bg-gray-300'}`} />
                    </div>
                  ))}
                </div>
              </framerMotion.div>
            )}

            {activeTab === 'Photos' && (
              <framerMotion.div
                key="photos"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6 flex flex-col gap-4"
              >
                <h3 className="font-bold text-[#2e3552] dark:text-white">All Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=300&q=80',
                    'https://images.unsplash.com/photo-1518638150341-f70653665547?auto=format&fit=crop&w=300&q=80'
                  ].map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-sm cursor-pointer">
                      <img src={url} alt={`Gallery grid ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </framerMotion.div>
            )}

            {activeTab === 'Traditions' && (
              <framerMotion.div
                key="traditions"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6 flex flex-col gap-4"
              >
                <h3 className="font-bold text-[#2e3552] dark:text-white">Cultural Traditions & Achievements</h3>
                <div className="flex flex-col gap-4">
                  {traditionsMock.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 flex flex-col gap-2 hover:border-[#6c63fc]/30 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-[#2e3552] dark:text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#2dd9d9]" /> {item.title}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.difficulty === 'Legendary' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                          item.difficulty === 'Epic' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                          'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-[#9aa3b8]">{item.desc}</p>
                      <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div className="bg-[#6c63fc] h-full" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </framerMotion.div>
            )}

            {activeTab === 'Home' && (
              <framerMotion.div
                key="home"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6 flex flex-col gap-4"
              >
                <h3 className="font-bold text-[#2e3552] dark:text-white">Profile Overview</h3>
                <p className="text-sm text-[#9aa3b8] leading-relaxed">
                  Welcome to {user.name}'s profile homepage! Here you can check general status details, active achievements, social connections, and other user stats.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-[#6c63fc]/5 p-4 rounded-xl border border-[#6c63fc]/10">
                    <span className="text-xs text-[#9aa3b8]">Level Rank</span>
                    <h4 className="text-lg font-black text-[#6c63fc] mt-1">{getTotemTitle(user.level)}</h4>
                  </div>
                  <div className="bg-[#2dd9d9]/5 p-4 rounded-xl border border-[#2dd9d9]/10">
                    <span className="text-xs text-[#9aa3b8]">Tribal Groups</span>
                    <h4 className="text-lg font-black text-[#2dd9d9] mt-1">{user.tribes.join(', ')}</h4>
                  </div>
                </div>
              </framerMotion.div>
            )}

            {activeTab === 'Journal' && (
              <framerMotion.div
                key="journal"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6 flex flex-col gap-4"
              >
                <h3 className="font-bold text-[#2e3552] dark:text-white">Cultural Journal</h3>
                <p className="text-sm text-[#9aa3b8]">
                  Personal notes and records of traditions, tribes visited, and cultural highlights.
                </p>
                <div className="border-l-2 border-[#6c63fc] pl-4 py-2 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9aa3b8]">JUNE 2026</span>
                  <h4 className="font-bold text-xs text-[#2e3552] dark:text-white">Discovered the Fon Kingdom storytelling tradition</h4>
                  <p className="text-xs text-[#9aa3b8]">Encountered beautiful folklore and oral traditions of Benin during the last cultural gathering.</p>
                </div>
              </framerMotion.div>
            )}

            {activeTab === 'Messages' && (
              <framerMotion.div
                key="messages"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6 flex flex-col gap-4"
              >
                <h3 className="font-bold text-[#2e3552] dark:text-white">Inbox Chat</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type your message here..." 
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-[#2e3552] dark:text-white focus:outline-none focus:border-[#6c63fc]"
                  />
                  <button className="px-4 py-2 bg-[#6c63fc] text-white font-bold text-xs rounded-xl hover:bg-[#5a52e0] transition-colors cursor-pointer">
                    Send
                  </button>
                </div>
              </framerMotion.div>
            )}

            {activeTab === 'Settings' && (
              <framerMotion.div
                key="settings"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6 flex flex-col gap-4"
              >
                <h3 className="font-bold text-[#2e3552] dark:text-white">Profile Settings</h3>
                <p className="text-sm text-[#9aa3b8]">
                  Manage profile cards, customize hexagon borders, or edit personal social links.
                </p>
              </framerMotion.div>
            )}
          </framerAnimatePresence>
        </div>
      </div>
    </framerMotion.div>
  );
};
