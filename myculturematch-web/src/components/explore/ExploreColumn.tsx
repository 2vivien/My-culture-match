import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Users, UserPlus, Images, SquarePlay, Flame, Heart, MessageCircle, Check, Plus, ExternalLink, Search, Play, Landmark, Unplug } from 'lucide-react';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Button } from '@/src/components/ui/button';
import { useUIStore } from '@/src/stores/useUIStore';
import { UserCard } from '../connections/UserCard';
import { UserRow } from '../connections/UserRow';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface TribeItem {
  id: string;
  name: string;
  tag: string;
  visitors: string;
  desc: string;
  avatar: string;
  joined: boolean;
  glow: 'turquoise' | 'violet' | 'amber' | 'emerald' | 'none';
}

interface CompanionItem {
  id: string;
  name: string;
  avatar: string;
  matchScore: number;
  level: number;
  glow: 'turquoise' | 'violet' | 'amber' | 'emerald';
  interests: string[];
  connected: boolean;
}

interface ImagePost {
  id: string;
  url: string;
  title: string;
  likes: string;
  comments: string;
  category: string;
}

interface VideoPost {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  plays: string;
  category: string;
}

export const ExploreColumn: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const [activeSubTab, setActiveSubTab] = useState<'Tribu' | 'Connexion' | 'Images' | 'Vidéo'>('Tribu');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxImage, setLightboxImage] = useState<ImagePost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- MOCK DATA ---
  const [tribes, setTribes] = useState<TribeItem[]>([
    {
      id: 't1',
      name: 'Yamato Heritage Circle',
      tag: 'yamato',
      visitors: '4.6M',
      desc: 'Connect with practitioners of Shinto rituals, traditional Japanese calligraphy, and festival drumming.',
      avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80',
      joined: false,
      glow: 'turquoise',
    },
    {
      id: 't2',
      name: 'Quechua Weaver Guild',
      tag: 'quechua',
      visitors: '969K',
      desc: 'Shared Andean history, complex loom weaving guides, and traditional solar festival celebrations.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      joined: true,
      glow: 'violet',
    },
    {
      id: 't3',
      name: 'Ainu Totem Folklore',
      tag: 'ainu',
      visitors: '149K',
      desc: 'Preserving Kamuy folklore, sacred woodcrafts, and nature-inspired dialect songs of Hokkaido.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      joined: false,
      glow: 'amber',
    },
    {
      id: 't4',
      name: 'Maori Haka Alliance',
      tag: 'maori',
      visitors: '640K',
      desc: 'Explore the ancestral origins, powerful chants, and deep spiritual meanings behind the Haka.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      joined: false,
      glow: 'emerald',
    },
    {
      id: 't5',
      name: 'Norse Runes & Sagas',
      tag: 'norse',
      visitors: '4.1M',
      desc: 'Discover Edda poetry, Elder Futhark rune scripts, and historical Viking longhouse rituals.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      joined: false,
      glow: 'none',
    },
    {
      id: 't6',
      name: 'Benin Voodoo Rhythms',
      tag: 'voodoo',
      visitors: '28K',
      desc: 'Authentic West African drumming tracks, sacred spiritual ceremonies, and regional heritage history.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      joined: false,
      glow: 'turquoise',
    },
  ]);

  const [moreTribes, setMoreTribes] = useState<TribeItem[]>([
    {
      id: 't7',
      name: 'Celtic Ogham Circles',
      tag: 'celtic',
      visitors: '150K',
      desc: 'Tree mythology, ancient script carved in stone, and seasonal solstice fire gatherings.',
      avatar: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=150&q=80',
      joined: false,
      glow: 'amber',
    },
    {
      id: 't8',
      name: 'Zulu Warrior Traditions',
      tag: 'zulu',
      visitors: '300K',
      desc: 'Traditional beadwork language, vibrant tribal dances, and historical accounts of legendary kings.',
      avatar: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=150&q=80',
      joined: false,
      glow: 'emerald',
    },
  ]);

  const [companions, setCompanions] = useState<CompanionItem[]>([
    {
      id: 'c1',
      name: 'Keisuke',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
      matchScore: 98,
      level: 21,
      glow: 'turquoise',
      interests: ['Shinto Rituals', 'Ancestral Art', 'Flute Drums'],
      connected: false,
    },
    {
      id: 'c2',
      name: 'Jumana',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
      matchScore: 94,
      level: 18,
      glow: 'violet',
      interests: ['Quechua Looms', 'Andean Tales', 'Alpaca Crafts'],
      connected: true,
    },
    {
      id: 'c3',
      name: 'Kaelen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      matchScore: 89,
      level: 12,
      glow: 'amber',
      interests: ['Norse Mythology', 'Elder Runes', 'Saga Singing'],
      connected: false,
    },
    {
      id: 'c4',
      name: 'Nala',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80',
      matchScore: 87,
      level: 15,
      glow: 'emerald',
      interests: ['Benin Rhythms', 'Tribal Dance', 'Bead Weaving'],
      connected: false,
    },
  ]);

  const images: ImagePost[] = [
    {
      id: 'i1',
      url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80',
      title: 'Traditional Temple Shrine Festival',
      likes: '12K',
      comments: '342',
      category: 'Rituals & Ceremonies',
    },
    {
      id: 'i2',
      url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=500&q=80',
      title: 'Andean Native Wool Dyeing Process',
      likes: '8.4K',
      comments: '189',
      category: 'Weaving & Crafts',
    },
    {
      id: 'i3',
      url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=500&q=80',
      title: 'Traditional African Bead Collars',
      likes: '15.2K',
      comments: '512',
      category: 'Ancestral Art',
    },
    {
      id: 'i4',
      url: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=500&q=80',
      title: 'Japanese Taiko Drumming Ceremony',
      likes: '19.8K',
      comments: '702',
      category: 'Rituals & Ceremonies',
    },
    {
      id: 'i5',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
      title: 'Highland Traditional Outfits',
      likes: '6.2K',
      comments: '98',
      category: 'Gastronomy',
    },
    {
      id: 'i6',
      url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=500&q=80',
      title: 'Solstice Gatherings in Celtic Forest',
      likes: '22K',
      comments: '990',
      category: 'Mythology & Tales',
    },
  ];

  const videos: VideoPost[] = [
    {
      id: 'v1',
      thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=500&q=80',
      title: 'Haka ancestral dance performance live',
      duration: '2:45',
      plays: '450K',
      category: 'Rituals & Ceremonies',
    },
    {
      id: 'v2',
      thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=500&q=80',
      title: 'Andean backstrap loom weaving tutorial',
      duration: '5:12',
      plays: '120K',
      category: 'Weaving & Crafts',
    },
    {
      id: 'v3',
      thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=500&q=80',
      title: 'Shinto festival shrine carry full ritual',
      duration: '3:30',
      plays: '380K',
      category: 'Rituals & Ceremonies',
    },
    {
      id: 'v4',
      thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=500&q=80',
      title: 'Voodoo fire dance ceremony drum track',
      duration: '8:45',
      plays: '95K',
      category: 'Mythology & Tales',
    },
  ];

  // --- ACTIONS ---
  const toggleJoinTribe = (id: string, isMore = false) => {
    if (isMore) {
      setMoreTribes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, joined: !t.joined } : t))
      );
    } else {
      setTribes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, joined: !t.joined } : t))
      );
    }
  };

  const toggleConnectCompanion = (id: string) => {
    setCompanions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c))
    );
  };

  // --- CATEGORIES ---
  const categoriesMap = {
    Tribu: ['All', 'Most Visited', 'Rituals & Ceremonies', 'Weaving & Crafts', 'Ancestral Art', 'Mythology & Tales', 'Gastronomy'],
    Connexion: ['All', '90%+ Matches', 'Shared Totems', 'Active Level'],
    Images: ['All', 'Rituals & Ceremonies', 'Weaving & Crafts', 'Ancestral Art', 'Mythology & Tales', 'Gastronomy'],
    Vidéo: ['All', 'Rituals & Ceremonies', 'Weaving & Crafts', 'Mythology & Tales'],
  };

  const currentCategories = categoriesMap[activeSubTab];

  // Filtering lists based on categories
  const filteredTribes = tribes.filter((t) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Most Visited') return t.visitors.endsWith('M');
    return t.desc.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase()) || t.name.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase());
  });

  const filteredCompanions = companions.filter((c) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchInterests = c.interests.some(i => i.toLowerCase().includes(q));
      if (!matchName && !matchInterests) return false;
    }
    if (activeCategory === 'All') return true;
    if (activeCategory === '90%+ Matches') return c.matchScore >= 90;
    if (activeCategory === 'Shared Totems') return c.interests.length >= 3;
    if (activeCategory === 'Active Level') return c.level >= 15;
    return true;
  });

  const filteredImages = images.filter((img) => {
    if (activeCategory === 'All') return true;
    return img.category === activeCategory;
  });

  const filteredVideos = videos.filter((v) => {
    if (activeCategory === 'All') return true;
    return v.category === activeCategory;
  });

  // Auto-switch to Connexion tab if searching for a person or their specific interests
  React.useEffect(() => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const hasPersonMatch = companions.some(c =>
        c.name.toLowerCase().includes(q) ||
        c.interests.some(i => i.toLowerCase().includes(q))
      );
      const hasTribeMatch = tribes.some(t =>
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q)
      );
      
      if (hasPersonMatch && (!hasTribeMatch || companions.some(c => c.name.toLowerCase() === q))) {
        setActiveSubTab('Connexion');
      }
    }
  }, [searchQuery, companions, tribes]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Search & Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-app-black dark:text-zinc-100">
            Explore Communities
          </h1>
          <p className="text-xs text-app-gray dark:text-zinc-400 font-medium">
            Discover cultural matches, global companions, photos, and Reels.
          </p>
        </div>

        {/* Mini Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4.5 h-4.5 text-app-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search matching traditions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-app-black dark:text-zinc-100 placeholder:text-app-gray/70 focus:outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]"
          />
        </div>
      </div>

      {/* Main Sub-Tab Switcher Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100/70 dark:bg-zinc-900/60 rounded-full w-fit mb-5 shrink-0 select-none border border-app-border/40 dark:border-zinc-850">
        {(['Tribu', 'Connexion', 'Images', 'Vidéo'] as const).map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveSubTab(tab);
                setActiveCategory('All');
              }}
              className={`flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-app-black text-white dark:bg-white dark:text-app-black shadow-sm'
                  : 'text-app-gray hover:text-app-black dark:hover:text-zinc-200'
              }`}
            >
              {tab === 'Tribu' && <Landmark className="w-3.5 h-3.5" />}
              {tab === 'Connexion' && <Unplug className="w-3.5 h-3.5" />}
              {tab === 'Images' && <Images className="w-3.5 h-3.5" />}
              {tab === 'Vidéo' && <SquarePlay className="w-3.5 h-3.5" />}
              {tab}
            </button>
          );
        })}
      </div>

      {/* Categories Horizontal Scroll Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pr-2 pb-3 mb-6 shrink-0 hide-scrollbar select-none">
        {currentCategories.map((cat) => {
          const isCatActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-bold tracking-tight px-4 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isCatActive
                  ? 'bg-[#E27D60] text-white border-[#E27D60] dark:bg-[#c66b50] dark:border-[#c66b50] shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-zinc-200'
              }`}
            >
              {cat === 'Most Visited' && <Flame className="w-3.5 h-3.5 fill-current text-orange-500 border-none" />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Scrollable Contents Window */}
      <div className="flex-1 overflow-y-auto pr-1 select-none hide-scrollbar">
        <AnimatePresence mode="wait">
          {/* TRIBU VIEW (Reddit-like Grid) */}
          {activeSubTab === 'Tribu' && (
            <motion.div
              key="tribu-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-xs font-black text-app-gray dark:text-zinc-400 uppercase tracking-widest mb-4">
                  Recommended for you
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTribes.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-zinc-900/60 rounded-[20px] p-5 border border-app-border dark:border-zinc-850 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative"
                    >
                      <div>
                        {/* Upper Section */}
                        <div 
                          onClick={() => setActiveTab('Tribu')}
                          className="flex items-center gap-3.5 mb-3.5 cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <TotemAvatar
                            src={item.avatar}
                            alt={item.name}
                            size="md"
                            glow={item.glow}
                            level={item.glow === 'none' ? undefined : 14}
                          />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate leading-tight group-hover:text-[#E27D60] transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                              {item.visitors} weekly matching
                            </p>
                          </div>
                        </div>
                        {/* Description */}
                        <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                          {item.desc}
                        </p>
                      </div>

                      {/* Join Action button */}
                      <button
                        onClick={() => toggleJoinTribe(item.id)}
                        className={`w-full py-2 rounded-xl text-xs font-black cursor-pointer tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          item.joined
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-zinc-200 border border-app-border dark:border-zinc-750'
                            : 'bg-app-black text-white dark:bg-white dark:text-app-black hover:opacity-90'
                        }`}
                      >
                        {item.joined ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3.5] text-green-600" />
                            Joined
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                            Join
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {filteredTribes.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline" className="text-xs font-extrabold rounded-full px-8 py-2.5 dark:border-zinc-800 dark:text-zinc-300">
                      Show more
                    </Button>
                  </div>
                )}
              </div>

              {/* Sub-Section: More Like Ancestral Matches */}
              <div>
                <h3 className="text-xs font-black text-app-gray dark:text-zinc-400 uppercase tracking-widest mb-4">
                  More like your Totem Match
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {moreTribes.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-zinc-900/60 rounded-[20px] p-5 border border-app-border dark:border-zinc-850 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
                    >
                      <div>
                        <div 
                          onClick={() => setActiveTab('Tribu')}
                          className="flex items-center gap-3.5 mb-3.5 cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <TotemAvatar
                            src={item.avatar}
                            alt={item.name}
                            size="md"
                            glow={item.glow}
                            level={12}
                          />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate leading-tight group-hover:text-[#E27D60] transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                              {item.visitors} visitors
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                          {item.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleJoinTribe(item.id, true)}
                        className={`w-full py-2 rounded-xl text-xs font-black cursor-pointer tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          item.joined
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-zinc-200 border border-app-border dark:border-zinc-750'
                            : 'bg-app-black text-white dark:bg-white dark:text-app-black hover:opacity-90'
                        }`}
                      >
                        {item.joined ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3.5] text-green-600" />
                            Joined
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                            Join
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* CONNEXION VIEW (Discover Potential Connections) */}
          {activeSubTab === 'Connexion' && (() => {
            const mapCompanionToUser = (comp: CompanionItem): ConnectionUser => ({
              id: comp.id,
              name: comp.name,
              avatar: comp.avatar,
              matchScore: comp.matchScore,
              country: 'Japan',
              countryFlag: '🇯🇵',
              countryCode: comp.name === 'Keisuke' ? 'JP' : comp.name === 'Jumana' ? 'JO' : comp.name === 'Kaelen' ? 'NO' : 'BJ',
              interestedCount: 125,
              compagnonsCount: 48,
              interests: comp.interests,
              isConnected: comp.connected,
            });

            return (
              <motion.div
                key="companion-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* Desktop View (Grid Cards) */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {filteredCompanions.map((comp) => (
                    <UserCard
                      key={comp.id}
                      user={mapCompanionToUser(comp)}
                      onConnect={() => toggleConnectCompanion(comp.id)}
                    />
                  ))}
                </div>

                {/* Mobile View (List Rows) */}
                <div className="flex md:hidden flex-col gap-3.5">
                  {filteredCompanions.map((comp) => (
                    <UserRow
                      key={comp.id}
                      user={mapCompanionToUser(comp)}
                      onConnect={() => toggleConnectCompanion(comp.id)}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {/* IMAGES VIEW (Instagram Grid) */}
          {activeSubTab === 'Images' && (
            <motion.div
              key="images-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setLightboxImage(img)}
                  className="aspect-square rounded-[16px] overflow-hidden relative group cursor-pointer border border-app-border dark:border-zinc-850 shadow-sm"
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hover info overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 text-white">
                    <span className="text-[9px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full w-fit">
                      {img.category}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs line-clamp-2 mb-2">
                        {img.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-[#E27D60] text-[#E27D60]" />
                          {img.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          {img.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* VIDÉO VIEW (TikTok / Reels layout) */}
          {activeSubTab === 'Vidéo' && (
            <motion.div
              key="video-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5"
            >
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-855 rounded-[20px] overflow-hidden relative group shadow-sm flex flex-col"
                >
                  {/* Video Thumbnail with play hover overlay */}
                  <div className="aspect-[9/16] relative overflow-hidden bg-black flex-1">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    {/* Play counts / duration overlays */}
                    <div className="absolute top-3 left-3 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black text-white">
                      {video.duration}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black text-white flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-white text-white" />
                      {video.plays} plays
                    </div>

                    {/* Centered big play button appearing on hover */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center text-app-black shadow-md transform group-hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 fill-current text-app-black translate-x-[2px]" />
                      </div>
                    </div>
                  </div>

                  {/* Title Info */}
                  <div className="p-4">
                    <span className="text-[9px] font-extrabold text-[#E27D60] dark:text-[#E27D60] uppercase tracking-widest">
                      {video.category}
                    </span>
                    <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-100 mt-1 line-clamp-2">
                      {video.title}
                    </h4>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LIGHTBOX MODAL FOR IMAGES */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl w-full bg-zinc-950 rounded-[28px] overflow-hidden border border-zinc-800 shadow-2xl relative cursor-default"
            >
              <div className="aspect-[4/3] sm:aspect-[16/10] bg-black">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 text-white select-none">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#E27D60] tracking-wider">
                      {lightboxImage.category}
                    </span>
                    <h3 className="font-black text-lg mt-1 tracking-tight leading-snug">
                      {lightboxImage.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3.5 text-xs font-black shrink-0 pt-1">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                      <Heart className="w-4 h-4 fill-[#E27D60] text-[#E27D60]" />
                      {lightboxImage.likes}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                      <MessageCircle className="w-4 h-4 fill-white" />
                      {lightboxImage.comments}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-between items-center text-zinc-400 text-xs">
                  <span>Partagé avec la communauté MyCultureMatch</span>
                  <button className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors text-xs font-bold">
                    View original <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
