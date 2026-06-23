import React from 'react';
import { Cable, RadioTower, Unplug, Facebook, Twitter, Instagram, Twitch } from 'lucide-react';
import { ThunderbirdIcon } from '@/src/components/ui/ThunderbirdIcon';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import coverImg from '../../../assets/cover.jpeg';

interface ProfileHeaderProps {
  user: any;
  connectionState: 'none' | 'pending' | 'connected';
  onToggleConnection: () => void;
  onSendMessage: () => void;
  getCountryCode: (location: string) => string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  connectionState,
  onToggleConnection,
  onSendMessage,
  getCountryCode,
}) => {
  return (
    <div className="bg-white dark:bg-[#1c212e] rounded-[24px] shadow-sm flex flex-col relative mt-2">
      {/* Image de couverture */}
      <div className="h-[220px] w-full rounded-t-[24px] overflow-hidden relative">
        <img src={coverImg} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Avatar hexagonal/cercle qui chevauche */}
      <div className="absolute top-[150px] left-1/2 -translate-x-1/2 z-10">
        <TotemAvatar 
          size="xl" 
          src={user.avatar} 
          level={user.level} 
          glow="none" 
          className="drop-shadow-xl"
          shape="cloud"
        />
      </div>

      {/* Contenu sous la bannière */}
      <div className="pt-[80px] pb-8 px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center text-center lg:text-left">
        
        {/* Ligne de statistiques à gauche */}
        <div className="flex justify-center lg:justify-start items-center gap-6 order-2 lg:order-1">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#2e3552] dark:text-white">{user.traditionsCount || 0}</span>
            <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Traditions</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#2e3552] dark:text-white">{user.interestedCount || 0}</span>
            <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Interested</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#2e3552] dark:text-white">{user.companionsCount || 0}</span>
            <span className="text-[11px] font-bold text-[#9aa3b8] uppercase tracking-wider">Companions</span>
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
              type="button"
              onClick={onToggleConnection}
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
              type="button"
              onClick={onSendMessage}
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
  );
};
