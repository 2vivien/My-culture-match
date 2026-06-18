import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Sparkles, MapPin, Users, Globe, 
  MoreHorizontal, Play, Unplug, RadioTower, Cable, Images, Heart, Share2, 
  ChevronLeft, ChevronRight, MessageCircle, User, SquarePlay, Bookmark,
  Calendar, Info, Facebook, Twitter, Instagram, Twitch, MessageSquare,
  FileText, ArchiveRestore
} from 'lucide-react';
import { ThunderbirdIcon } from '@/src/components/ui/ThunderbirdIcon';
import { useAppStore } from '@/src/stores/useAppStore';
import { userService } from '@/src/services/userService';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { useFeed } from '@/src/hooks/useFeed';
import { PostCard } from '@/src/components/feed/PostCard';
import coverImg from '../../../assets/cover.jpeg';

export const TotemProfile = () => {
  const { selectedTotemUserId, profileActiveTab: activeTab, setProfileActiveTab: setActiveTab, currentUser } = useAppStore();
  const user = userService.getUserById(selectedTotemUserId);
  const { posts } = useFeed();
  const [connectionState, setConnectionState] = useState<'none' | 'pending' | 'connected'>('none');

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

  // Helper to split location into City and Country
  const getCityAndCountry = (location: string) => {
    if (location.includes(' - ')) {
      const parts = location.split(' - ');
      return { city: parts[0], country: parts[1] };
    }
    const loc = location.toLowerCase();
    if (loc === 'benin') return { city: 'Cotonou', country: 'Benin' };
    if (loc === 'new zealand') return { city: 'Wellington', country: 'New Zealand' };
    if (loc === 'senegal') return { city: 'Dakar', country: 'Senegal' };
    if (loc === 'ethiopia') return { city: 'Addis Ababa', country: 'Ethiopia' };
    if (loc === 'mexico') return { city: 'Mexico City', country: 'Mexico' };
    if (loc === 'jordan') return { city: 'Amman', country: 'Jordan' };
    if (loc === 'usa') return { city: 'New York', country: 'USA' };
    if (loc === 'peru') return { city: 'Cusco', country: 'Peru' };
    if (loc === 'morocco') return { city: 'Casablanca', country: 'Morocco' };
    if (loc === 'brazil') return { city: 'Rio de Janeiro', country: 'Brazil' };
    return { city: location, country: location };
  };

  const isOwnProfile = user.id === currentUser.id;
  const profileTabs: Array<{id: any, icon: any, label: string}> = [
    { id: 'Posts', icon: FileText, label: 'Posts' },
    { id: 'Photos', icon: Images, label: 'Photos' },
    { id: 'Videos', icon: SquarePlay, label: 'Vidéos' },
    { id: 'Traditions', icon: ArchiveRestore, label: 'Traditions' },
    { id: 'About', icon: Info, label: 'À propos' },
    ...(isOwnProfile ? [{ id: 'Saves', icon: Bookmark, label: 'Enregistrements' }] : [])
  ];

  return (
    <motion.div
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
      {/* 6. HEADER DU PROFIL */}
      <div className="bg-white dark:bg-[#1c212e] rounded-[24px] shadow-sm flex flex-col relative mt-2">
        {/* Image de couverture */}
        <div className="h-[220px] w-full rounded-t-[24px] overflow-hidden relative">
          <img src={coverImg} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        {/* Avatar hexagonal/cercle qui chevauche */}
        <div className="absolute top-[150px] left-1/2 -translate-x-1/2 z-10">
          <TotemAvatar 
            size="xl" 
            src={user.avatar} 
            level={user.level} 
            glow="turquoise" 
            className="drop-shadow-xl"
            shape="circle"
          />
        </div>

        {/* Contenu sous la bannière */}
        <div className="pt-[80px] pb-8 px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center text-center lg:text-left">
          
          {/* Ligne de statistiques à gauche */}
          <div className="flex justify-center lg:justify-start items-center gap-6 order-2 lg:order-1">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#2e3552] dark:text-white">930</span>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#2e3552] dark:text-white">82</span>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Connexions</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#2e3552] dark:text-white">5.7K</span>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Following</span>
            </div>
            {/* Drapeau */}
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

          {/* Centre : Nom et Handle */}
          <div className="flex flex-col items-center justify-center order-1 lg:order-2">
            <h1 className="text-3xl font-black text-[#2e3552] dark:text-white">{user.name}</h1>
            <span className="text-[#2dd9d9] font-bold text-sm mt-1">@{user.name.toLowerCase()}</span>
          </div>

          {/* Droite : Boutons d'icônes et Réseaux Sociaux */}
          <div className="flex flex-col items-center lg:items-end gap-4 order-3 lg:order-3">
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if (connectionState === 'none') setConnectionState('pending');
                  else if (connectionState === 'pending') setConnectionState('connected');
                  else setConnectionState('none');
                }}
                className={`w-12 h-12 rounded-xl text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-md cursor-pointer ${
                  connectionState === 'connected' ? 'bg-[#2dd9d9]/20 text-[#2dd9d9]' :
                  connectionState === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-[#E27D60] dark:bg-[#c66b50]'
                }`}
                title="Connect"
              >
                {connectionState === 'connected' ? <Cable className="w-5 h-5" /> : 
                 connectionState === 'pending' ? <RadioTower className="w-5 h-5" /> : 
                 <Unplug className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => {
                  setActiveTab('Thunderbird');
                }}
                className="w-12 h-12 rounded-xl text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-md cursor-pointer bg-zinc-900 dark:bg-zinc-800"
                title="Send Message"
              >
                <ThunderbirdIcon className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* 4 Social Network Icons Only */}
            <div className="flex gap-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-[#3b5998] text-white flex items-center justify-center hover:scale-110 transition-transform" title="Facebook"><Facebook className="w-4 h-4 fill-current" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1da1f2] text-white flex items-center justify-center hover:scale-110 transition-transform" title="Twitter"><Twitter className="w-4 h-4 fill-current" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#e1306c] text-white flex items-center justify-center hover:scale-110 transition-transform" title="Instagram"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#7b5cf0] text-white flex items-center justify-center hover:scale-110 transition-transform" title="Twitch"><Twitch className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* 7. BARRE D'ONGLETS DE NAVIGATION DU PROFIL (7 ICONS) */}
      <div className="bg-white dark:bg-[#1c212e] rounded-[20px] shadow-sm px-6 flex items-stretch h-[100px] w-full mb-6 border border-gray-100 dark:border-zinc-800/50">
        <div className="flex h-full items-stretch flex-1 justify-start md:justify-center gap-1 sm:gap-2 overflow-x-auto hide-scrollbar">
          {profileTabs.map((tab, idx) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="flex h-full items-stretch shrink-0">
                {idx > 0 && <div className="w-[1px] bg-gray-200 dark:bg-zinc-800 self-center h-10 mx-1 sm:mx-2" />}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-full px-4 sm:px-6 flex items-center justify-center transition-colors group cursor-pointer ${
                    isActive ? 'text-[#2dd9d9] dark:text-[#2dd9d9] font-black' : 'text-[#9aa3b8] hover:text-[#2e3552] dark:hover:text-white'
                  }`}
                  title={tab.label}
                >
                  <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#2dd9d9] rounded-t-full shadow-[0_-2px_10px_rgba(45,217,217,0.4)]" 
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. CONTENU PRINCIPAL - ZONE DE CONTENU DYNAMIQUE */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'Posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6 max-w-2xl mx-auto w-full"
            >
              {(() => {
                const userPosts = posts.filter(p => p.author.id === user.id || p.author.name === user.name);
                const displayPosts = userPosts.length > 0 ? userPosts : [
                  {
                    id: `post-temp-${user.id}`,
                    author: {
                      id: user.id,
                      name: user.name,
                      avatar: user.avatar,
                      location: user.location
                    },
                    text: `Hello everyone! I'm thrilled to be part of MyCultureMatch. I look forward to exploring ancestral traditions and sharing stories about the ${user.tribes.join(' & ')} tribe! 🌍✨`,
                    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
                    likes: 124,
                    comments: 12,
                    views: 530,
                    date: 'Today',
                    createdAt: new Date().toISOString()
                  }
                ];
                return displayPosts.map(post => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <PostCard post={post} />
                  </motion.div>
                ));
              })()}
            </motion.div>
          )}

          {activeTab === 'Photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white dark:bg-[#1c212e] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black text-[#2e3552] dark:text-white text-lg">All Photos</h3>
                <span className="text-xs font-bold text-[#9aa3b8]">74 Photos</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=300&q=80',
                  'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=300&q=80',
                ].map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden hover:scale-[1.03] transition-transform duration-300 shadow-sm border border-gray-100 dark:border-zinc-800 cursor-pointer relative group">
                    <img src={url} alt={`Gallery grid item ${idx}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                      <span className="flex items-center gap-1 text-xs"><Heart className="w-4 h-4 fill-current text-[#E27D60]" /> {24 + idx * 7}</span>
                      <span className="flex items-center gap-1 text-xs"><MessageCircle className="w-4 h-4 fill-current text-white" /> {2 + idx}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white dark:bg-[#1c212e] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4"
            >
              <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Featured Videos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { title: 'Gaming Room Tour & Setup Review', views: '1.2K views', duration: '12:45', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80' },
                  { title: 'Ancestral Myths - Quechua Mythology', views: '840 views', duration: '24:15', thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80' },
                  { title: 'Voodoo Dance Ceremonies in Benin', views: '2.1K views', duration: '18:10', thumb: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80' }
                ].map((video, idx) => (
                  <div key={idx} className="flex flex-col gap-2 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800/50 bg-gray-50/30 dark:bg-zinc-900/40 group cursor-pointer">
                    <div className="aspect-video relative overflow-hidden bg-zinc-100">
                      <img src={video.thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <Play className="w-10 h-10 text-white fill-current drop-shadow-md" />
                      </div>
                      <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">{video.duration}</span>
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-xs text-[#2e3552] dark:text-white line-clamp-1 group-hover:text-[#6c63fc] transition-colors">{video.title}</h4>
                      <span className="text-[10px] text-[#9aa3b8]">{video.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Traditions' && (
            <motion.div
              key="traditions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Tribes & Traditions Stats Box */}
              <div className="md:col-span-1 bg-white dark:bg-[#1c212e] rounded-2xl shadow-sm p-6 flex flex-col gap-4 border border-gray-100 dark:border-zinc-800/50">
                <div className="w-12 h-12 rounded-xl bg-[#2dd9d9]/10 text-[#2dd9d9] flex items-center justify-center">
                  <ArchiveRestore className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2e3552] dark:text-white text-lg">Tribes & Traditions</h3>
                  <p className="text-sm text-[#9aa3b8] mt-1 leading-relaxed">
                    Connected to ancestral heritage and cultural collections.
                  </p>
                </div>
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-850 pb-2">
                    <span className="text-[#9aa3b8]">Traditions Unlocked</span>
                    <span className="text-[#2e3552] dark:text-white font-black">{user.traditionsCount || 18}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-850 pb-2">
                    <span className="text-[#9aa3b8]">Cultures Discovered</span>
                    <span className="text-[#2e3552] dark:text-white font-black">{user.culturesCount || 32}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-[#9aa3b8]">Active Tribes</span>
                    <span className="text-[#2e3552] dark:text-white font-black">{user.tribes.length}</span>
                  </div>
                </div>
              </div>

              {/* Tribe Details Cards */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <h3 className="font-black text-[#2e3552] dark:text-white text-lg px-1">Cultural Associations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.tribes.map((tribe, idx) => (
                    <div 
                      key={tribe} 
                      className="p-5 rounded-2xl bg-white dark:bg-[#1c212e] border border-gray-100 dark:border-zinc-800/50 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-[#2e3552] dark:text-white">{tribe} Tribe</span>
                        <span className="text-xs font-bold text-[#6c63fc] bg-[#6c63fc]/10 px-2 py-0.5 rounded-full">
                          Level {idx * 3 + 4}
                        </span>
                      </div>
                      <p className="text-xs text-[#9aa3b8] leading-relaxed">
                        {tribe === 'Fon' ? 'Known for the history of Dahomey, artistic brass castings, and vibrant ceremonial traditions.' :
                         tribe === 'Yoruba' ? 'One of the largest cultural groups in West Africa, famed for complex mythology, beadwork, and drums.' :
                         tribe === 'Adja' ? 'Ancestral group residing near the Mono River, keepers of unique folklore and agricultural rituals.' :
                         tribe === 'Maori' ? 'Indigenous Polynesian people of New Zealand, keepers of the Haka, wood carving, and oral history.' :
                         tribe === 'Quechua' ? 'Indigenous people of the Andes, keepers of rich weaving traditions, language, and solar festivals.' :
                         'Shared ancestral heritage, language dialects, and community celebrations passed down through generations.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'About' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Bio description */}
              <div className="lg:col-span-6 bg-white dark:bg-[#1c212e] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
                <h3 className="font-black text-[#2e3552] dark:text-white text-lg">About Me</h3>
                <p className="text-sm text-[#9aa3b8] leading-relaxed">
                  Hi! I'm {user.name}, a passionate gamer and culture explorer. I love discovering ancestral traditions and connecting with people globally!
                </p>
                <div className="border-t border-gray-100 dark:border-zinc-850 pt-4 flex gap-4 text-xs font-bold text-[#9aa3b8] mt-2">
                  <div className="flex flex-col">
                    <span className="text-[#2e3552] dark:text-white text-sm font-black">930</span>
                    <span>Posts Published</span>
                  </div>
                  <div className="h-8 w-[1px] bg-gray-100 dark:bg-zinc-850" />
                  <div className="flex flex-col">
                    <span className="text-[#2e3552] dark:text-white text-sm font-black">82</span>
                    <span>Connections</span>
                  </div>
                  <div className="h-8 w-[1px] bg-gray-100 dark:bg-zinc-850" />
                  <div className="flex flex-col">
                    <span className="text-[#2e3552] dark:text-white text-sm font-black">5.7K</span>
                    <span>Following</span>
                  </div>
                </div>
              </div>

              {/* Detail list card */}
              <div className="lg:col-span-6 bg-white dark:bg-[#1c212e] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
                <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Personal Details</h3>
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-850 pb-2">
                    <span className="text-[#9aa3b8] flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> City</span>
                    <span className="font-black text-[#2e3552] dark:text-white">{getCityAndCountry(user.location).city}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-850 pb-2">
                    <span className="text-[#9aa3b8] flex items-center gap-2"><Globe className="w-4 h-4 text-[#E27D60]" /> Country</span>
                    <span className="font-black text-[#2e3552] dark:text-white">{getCityAndCountry(user.location).country}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-850 pb-2">
                    <span className="text-[#9aa3b8] flex items-center gap-2"><User className="w-4 h-4 text-purple-500" /> Age</span>
                    <span className="font-black text-[#2e3552] dark:text-white">24 Years</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-850 pb-2">
                    <span className="text-[#9aa3b8] flex items-center gap-2"><Calendar className="w-4 h-4 text-green-500" /> Joined</span>
                    <span className="font-black text-[#2e3552] dark:text-white">March 26th, 2023</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-[#9aa3b8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500" /> Web</span>
                    <a href="https://www.gamehuntress.com" target="_blank" rel="noopener noreferrer" className="font-black text-[#2dd9d9] hover:underline">
                      www.gamehuntress.com
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Saves' && isOwnProfile && (
            <motion.div
              key="saves"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6 max-w-2xl mx-auto w-full"
            >
              <div className="bg-[#E27D60]/10 dark:bg-[#E27D60]/5 rounded-2xl p-6 border border-[#E27D60]/20 flex flex-col gap-2 mb-2 text-center">
                <Bookmark className="w-8 h-8 text-[#E27D60] mx-auto mb-2" />
                <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Your Saved Traditions</h3>
                <p className="text-sm text-[#9aa3b8]">Only you can see what you've saved. Rediscover these traditions anytime.</p>
              </div>
              {posts.slice(0, 2).map(post => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <PostCard post={post} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
