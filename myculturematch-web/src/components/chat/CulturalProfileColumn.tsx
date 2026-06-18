import React from 'react';
import { Conversation } from '@/src/types/chat.types';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Globe, BookOpen, Star, HelpCircle, X } from 'lucide-react';

interface ProfileColumnProps {
  partner: Conversation;
  onClose: () => void;
}

export const CulturalProfileColumn: React.FC<ProfileColumnProps> = ({ partner, onClose }) => {
  return (
    <div className="w-full md:w-80 border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[24px] flex flex-col h-full select-none shadow-soft shrink-0 overflow-hidden relative animate-slide-in">
      {/* Cover Banner */}
      <div className="h-24 bg-[#E27D60] dark:bg-[#c66b50] relative shrink-0">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Profile Info overlay */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 mt-[-32px] relative hide-scrollbar space-y-5">
        <div className="flex flex-col items-center text-center">
          <TotemAvatar
            src={partner.avatar}
            alt={partner.name}
            size="lg"
            glow={partner.glow as any}
            level={partner.level}
            className="border-4 border-white dark:border-zinc-950 bg-white dark:bg-zinc-950 shadow-md"
          />
          <h3 className="font-bold text-sm text-app-black dark:text-zinc-100 mt-2">{partner.name}</h3>
          <p className="text-[11px] text-app-gray dark:text-zinc-400 mt-0.5 font-semibold">
            {partner.country}
          </p>
          <p className="text-xs text-app-gray dark:text-zinc-400 mt-3 italic leading-relaxed bg-[#FCFCFC] dark:bg-zinc-900 border border-app-border dark:border-zinc-800 p-3 rounded-2xl">
            "{partner.bio}"
          </p>
        </div>

        {/* Culture & Languages */}
        <div className="space-y-2 border-t border-app-border dark:border-zinc-800 pt-4">
          <h4 className="font-bold text-xs text-app-black dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-[#E27D60]" />
            Culture & Language
          </h4>
          <p className="text-xs text-app-gray dark:text-zinc-300">
            <span className="font-bold text-app-black dark:text-white">Cultural Root:</span> {partner.culture}
          </p>
          <p className="text-xs text-app-gray dark:text-zinc-300">
            <span className="font-bold text-app-black dark:text-white">Languages:</span> {partner.lang}
          </p>
        </div>

        {/* Ancestral Traditions */}
        <div className="space-y-2.5 border-t border-app-border dark:border-zinc-800 pt-4">
          <h4 className="font-bold text-xs text-app-black dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-orange-500" />
            Favorite Traditions
          </h4>
          <div className="space-y-1.5">
            {partner.traditions.map((trad, idx) => (
              <div
                key={idx}
                className="text-xs bg-slate-50 dark:bg-zinc-900 border border-app-border dark:border-zinc-805 rounded-xl p-2 font-medium text-app-black dark:text-zinc-300"
              >
                {trad}
              </div>
            ))}
          </div>
        </div>

        {/* Core Tribus */}
        <div className="space-y-2.5 border-t border-app-border dark:border-zinc-800 pt-4">
          <h4 className="font-bold text-xs text-app-black dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Star className="w-4 h-4 text-yellow-500" />
            Common Tribes ({partner.tribes.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {partner.tribes.map((tribe) => (
              <span
                key={tribe}
                className="text-[10px] font-bold bg-[#E27D60]/10 text-[#E27D60] dark:bg-[#E27D60]/10 dark:text-[#E27D60] border border-[#E27D60]/15 rounded-full px-2.5 py-1"
              >
                #{tribe}
              </span>
            ))}
          </div>
        </div>

        {/* Shared Media */}
        {partner.sharedMedia.length > 0 && (
          <div className="space-y-2.5 border-t border-app-border dark:border-zinc-800 pt-4">
            <h4 className="font-bold text-xs text-app-black dark:text-zinc-200 flex items-center justify-between uppercase tracking-wider">
              <span>Shared Media</span>
              <span className="text-[10px] text-app-gray">{partner.sharedMedia.length} files</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {partner.sharedMedia.map((url, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-app-border dark:border-zinc-800">
                  <img src={url} alt="shared" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
