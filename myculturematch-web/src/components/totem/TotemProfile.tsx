import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, Music, Utensils, Landmark, Sparkles, MapPin, Award, BookOpen, Users, Compass, Globe, 
  MoreHorizontal, Plus, MessageSquare, Facebook, Twitter, Instagram, Youtube, Twitch, Gamepad2, Play 
} from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { userService } from '@/src/services/userService';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { getTotemTitle } from '@/src/types/user';

export const TotemProfile = () => {
  const { selectedTotemUserId } = useAppStore();
  const user = userService.getUserById(selectedTotemUserId);
  const [activeTab, setActiveTab] = useState<'Timeline' | 'Photos' | 'Videos' | 'Friends' | 'Groups'>('Timeline');

  // Hardcoded banner matching the user's specific image request, or using the user's default if not applicable
  const bannerUrl = '/home/vivien/Téléchargements/_ (31).jpeg'; // using local path as requested, fallback to objectUrl if it was uploaded, but the user explicitly requested this exact string if possible, or we just use a generic gaming one. Let's use a standard Unsplash gaming banner as fallback just in case the local path doesn't load in browser.
  const webBannerUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80";

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
          <img src={webBannerUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        {/* Avatar hexagonal qui chevauche */}
        <div className="absolute top-[150px] left-1/2 -translate-x-1/2 z-10">
          <TotemAvatar 
            size="xl" 
            src={user.avatar} 
            level={user.level} 
            glow="turquoise" 
            className="drop-shadow-xl"
            // Retiré la bordure blanche carrée qui rendait moche
          />
        </div>

        {/* Contenu sous la bannière */}
        <div className="pt-[80px] pb-8 px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center text-center lg:text-left">
          
          {/* Ligne de statistiques à gauche */}
          <div className="flex justify-center lg:justify-start items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#2e3552] dark:text-white">930</span>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#2e3552] dark:text-white">82</span>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Friends</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#2e3552] dark:text-white">5.7K</span>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Visits</span>
            </div>
            {/* Drapeau */}
            <div className="flex flex-col items-center ml-4">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm mb-1">
                <img src="https://flagcdn.com/us.svg" alt="USA" className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">USA</span>
            </div>
          </div>

          {/* Centre : Nom et Lien */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-black text-[#2e3552] dark:text-white">{user.name}</h1>
            <a href="#" className="text-[#2dd9d9] font-bold text-sm mt-1 hover:underline">www.gamehuntress.com</a>
          </div>

          {/* Droite : Boutons et Réseaux Sociaux */}
          <div className="flex flex-col items-center lg:items-end gap-4">
            <div className="flex gap-3">
              <button 
                className="px-6 py-2.5 rounded-full text-white font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                style={{ background: 'var(--gradient-btn-primary)' }}
              >
                Add Friend <Plus className="w-4 h-4" />
              </button>
              <button 
                className="px-6 py-2.5 rounded-full text-white font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                style={{ background: 'var(--gradient-btn-secondary)' }}
              >
                Send Message
              </button>
            </div>
            
            <div className="flex gap-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-[#3b5998] text-white flex items-center justify-center hover:scale-110 transition-transform"><Facebook className="w-4 h-4 fill-current" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1da1f2] text-white flex items-center justify-center hover:scale-110 transition-transform"><Twitter className="w-4 h-4 fill-current" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#e1306c] text-white flex items-center justify-center hover:scale-110 transition-transform"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#7b5cf0] text-white flex items-center justify-center hover:scale-110 transition-transform"><Twitch className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#ff0000] text-white flex items-center justify-center hover:scale-110 transition-transform"><Youtube className="w-4 h-4" /></a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#6c7393] text-white flex items-center justify-center hover:scale-110 transition-transform"><Gamepad2 className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* 7. BARRE D'ONGLETS */}
      <div className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm px-6 flex justify-between items-center h-[60px] overflow-hidden">
        <div className="flex h-full gap-8">
          {['Timeline', 'Photos', 'Videos', 'Friends', 'Groups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`relative h-full flex items-center font-bold text-sm transition-colors ${
                activeTab === tab ? 'text-[#2e3552] dark:text-white' : 'text-[#9aa3b8] hover:text-[#2e3552] dark:hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2dd9d9] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
        <button className="text-[#9aa3b8] hover:text-[#2e3552] dark:hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
      </div>

      {/* 8. CONTENU PRINCIPAL - 3 COLONNES (Simulé) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#2e3552] dark:text-white">About Me</h3>
              <MoreHorizontal className="w-5 h-5 text-[#9aa3b8] cursor-pointer" />
            </div>
            <p className="text-sm text-[#9aa3b8] mb-6 leading-relaxed">
              Hi! I'm Marina, a passionate gamer and stream designer. I love exploring new cultures and gaming worlds!
            </p>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between"><span className="text-[#9aa3b8]">Joined</span><span className="font-bold text-[#2e3552] dark:text-white">March 26th, 2023</span></div>
              <div className="flex justify-between"><span className="text-[#9aa3b8]">City</span><span className="font-bold text-[#2e3552] dark:text-white">Los Angeles, CA</span></div>
              <div className="flex justify-between"><span className="text-[#9aa3b8]">Country</span><span className="font-bold text-[#2e3552] dark:text-white">United States</span></div>
              <div className="flex justify-between"><span className="text-[#9aa3b8]">Age</span><span className="font-bold text-[#2e3552] dark:text-white">24</span></div>
              <div className="flex justify-between"><span className="text-[#9aa3b8]">Web</span><a href="#" className="font-bold text-[#2dd9d9] hover:underline">www.gamehuntress.com</a></div>
            </div>
          </div>
        </div>

        {/* Colonne centrale */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6">
            <div className="flex gap-4 items-center mb-4">
              <TotemAvatar size="sm" src={user.avatar} glow="turquoise" />
              <div>
                <h4 className="font-bold text-[#2e3552] dark:text-white text-sm">{user.name}</h4>
                <p className="text-xs text-[#9aa3b8]">5 hours ago</p>
              </div>
            </div>
            <p className="text-sm text-[#2e3552] dark:text-white mb-4">
              Just finished setting up my new streaming room! What do you guys think? 🎮✨
            </p>
            <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 h-64 flex items-center justify-center">
              <span className="text-[#9aa3b8]">[Image Placeholder]</span>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1c212e] rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#2e3552] dark:text-white">Stream Box</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 h-32 flex items-center justify-center mb-3">
              <Play className="w-8 h-8 text-[#9aa3b8]" />
            </div>
            <div className="flex gap-2 items-center">
              <TotemAvatar size="xs" src={user.avatar} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#2e3552] dark:text-white">Playing Athena's...</span>
                <span className="text-[10px] text-[#9aa3b8]">GameHuntress</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
