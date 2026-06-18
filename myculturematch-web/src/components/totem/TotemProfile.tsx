import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Music, Utensils, Landmark, Sparkles, MapPin, Award, BookOpen, Users, Compass, Globe } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { userService } from '@/src/services/userService';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { getTotemTitle } from '@/src/types/user';

const badgeIcons = {
  Artisan: Palette,
  Musique: Music,
  Cuisine: Utensils,
  Histoire: Landmark,
  Traditions: Sparkles,
};

const banners = {
  orange: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80',
  red: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  blue: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80',
  turquoise: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  violet: 'https://images.unsplash.com/photo-1518638150341-f70653665547?auto=format&fit=crop&w=800&q=80',
};

export const TotemProfile = () => {
  const { selectedTotemUserId } = useAppStore();
  const user = userService.getUserById(selectedTotemUserId);
  const [activeTab, setActiveTab] = useState<'Traditions' | 'Culture' | 'Tribu' | 'Collections'>('Traditions');

  const bannerUrl = banners[user.glow] || banners.orange;
  const title = getTotemTitle(user.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-zinc-950 rounded-[28px] overflow-hidden border border-app-border dark:border-zinc-850 shadow-soft flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar max-w-2xl mx-auto w-full"
    >
      <div className="relative h-44 shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10" />
        <img src={bannerUrl} alt="Culture Banner" className="w-full h-full object-cover filter blur-[2px] scale-105 select-none animate-in fade-in duration-500" />
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-20">
          <TotemAvatar size="xl" src={user.avatar} alt={user.name} level={user.level} glow={user.glow} className="border-[4px] border-white dark:border-zinc-950 rounded-2xl shadow-float" />
        </div>
      </div>

      <div className="pt-20 px-4 sm:px-6 pb-6 text-center select-none flex-1 flex flex-col justify-between">
        <div className="flex flex-col items-center">
          <h2 className="font-extrabold text-xl sm:text-2xl text-app-black dark:text-zinc-50 flex flex-wrap items-center gap-1.5 justify-center">
            {user.name}
            <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-zinc-900 font-bold text-app-gray px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-800">
              {title}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-app-gray mt-1 flex flex-wrap items-center gap-1 font-semibold justify-center">
            <MapPin className="w-3.5 h-3.5" /> {user.location} <span className="hidden sm:inline">•</span> {user.tribes.join(' • ')}
          </p>

          <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center mt-4">
            {Object.entries(badgeIcons).map(([badgeName, Icon]) => (
              <div key={badgeName} className="flex items-center gap-1 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-app-border dark:border-zinc-850 rounded-full px-2.5 py-1 text-[10px] sm:text-xs text-app-black dark:text-zinc-200 font-semibold cursor-pointer">
                <Icon className="w-3.5 h-3.5" />
                <span>{badgeName}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full bg-white dark:bg-zinc-900/40 rounded-2xl p-3 sm:p-4 mt-6 border border-app-border dark:border-zinc-850">
            <div className="text-center group cursor-pointer">
              <span className="block font-black text-base sm:text-lg text-app-black dark:text-zinc-100 group-hover:text-amber-500 transition-colors">{user.level}</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-app-gray tracking-wider flex items-center gap-0.5 justify-center">
                <Award className="w-3 h-3" /> Totem
              </span>
            </div>
            <div className="text-center group cursor-pointer">
              <span className="block font-black text-base sm:text-lg text-app-black dark:text-zinc-100 group-hover:text-blue-500 transition-colors">{user.tribesCount}</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-app-gray tracking-wider flex items-center gap-0.5 justify-center">
                <Users className="w-3 h-3" /> Tribus
              </span>
            </div>
            <div className="text-center group cursor-pointer">
              <span className="block font-black text-base sm:text-lg text-app-black dark:text-zinc-100 group-hover:text-emerald-500 transition-colors">{user.traditionsCount}</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-app-gray tracking-wider flex items-center gap-0.5 justify-center">
                <BookOpen className="w-3 h-3" /> Traditions
              </span>
            </div>
            <div className="text-center group cursor-pointer">
              <span className="block font-black text-base sm:text-lg text-app-black dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">{user.culturesCount}</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-app-gray tracking-wider flex items-center gap-0.5 justify-center">
                <Compass className="w-3 h-3" /> Explorer
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex border-b border-app-border dark:border-zinc-850 w-full justify-between px-2 overflow-x-auto shrink-0 select-none">
          {['Traditions', 'Culture', 'Tribu', 'Collections'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 font-bold text-xs sm:text-sm transition-all relative px-1 cursor-pointer whitespace-nowrap ${
                activeTab === tab ? 'text-app-black dark:text-zinc-50' : 'text-app-gray hover:text-black dark:hover:text-zinc-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="totem-tab-bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-app-black dark:bg-zinc-200" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex-1 text-left min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {activeTab === 'Traditions' && (
                <div className="bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-850 rounded-2xl p-4">
                  <h4 className="font-bold text-sm text-app-black dark:text-zinc-100 mb-1 flex items-center gap-1.5">
                    <span>🏺</span> Transmitting Ancestral Traditions
                  </h4>
                  <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed mb-3">
                    Currently sharing {user.traditionsCount} secret recipes and ritual stories with global explorers.
                  </p>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/20">Handicraft</span>
                    <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full border border-purple-500/20">Folklore</span>
                  </div>
                </div>
              )}
              {activeTab === 'Culture' && (
                <div className="bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-850 rounded-2xl p-4 flex gap-4 items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-app-black dark:text-zinc-100">Global Explorer</h4>
                    <p className="text-xs text-app-gray dark:text-zinc-400">Discovered {user.culturesCount} cultures worldwide. Active contributor in global forums.</p>
                  </div>
                </div>
              )}
              {activeTab === 'Tribu' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {user.tribes.map((tribe) => (
                    <div key={tribe} className="bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-850 rounded-2xl p-3 flex justify-between items-center">
                      <span className="font-semibold text-xs text-app-black dark:text-zinc-200">Tribe: {tribe}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">Member</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'Collections' && (
                <div className="text-center py-6">
                  <span className="text-xs text-app-gray dark:text-zinc-500">Digital cultural artifacts collection is empty. Join more ceremonies to harvest artifacts.</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
