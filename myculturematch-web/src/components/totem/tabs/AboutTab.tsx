import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, User, Calendar, Sparkles } from 'lucide-react';

interface AboutTabProps {
  user: any;
  getCityAndCountry: (location: string) => { city: string; country: string };
}

export const AboutTab: React.FC<AboutTabProps> = ({ user, getCityAndCountry }) => {
  const { city, country } = getCityAndCountry(user.location);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* Bio description */}
      <div className="lg:col-span-6 bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
        <h3 className="font-black text-[#2e3552] dark:text-white text-lg">About Me</h3>
        <p className="text-sm text-[#9aa3b8] leading-relaxed">
          Hi! I'm {user.name}, a passionate gamer and culture explorer. I love discovering ancestral traditions and connecting with people globally!
        </p>
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 flex gap-4 text-xs font-bold text-[#9aa3b8] mt-2">
          <div className="flex flex-col">
            <span className="text-[#2e3552] dark:text-white text-sm font-black">{user.traditionsCount || 0}</span>
            <span>Traditions</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-100 dark:bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[#2e3552] dark:text-white text-sm font-black">{user.interestedCount || 0}</span>
            <span>Interested</span>
          </div>
          <div className="h-8 w-[1px] bg-gray-100 dark:bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[#2e3552] dark:text-white text-sm font-black">{user.companionsCount || 0}</span>
            <span>Companions</span>
          </div>
        </div>
      </div>

      {/* Detail list card */}
      <div className="lg:col-span-6 bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
        <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Personal Details</h3>
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-[#9aa3b8] flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> City</span>
            <span className="font-black text-[#2e3552] dark:text-white">{city}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-[#9aa3b8] flex items-center gap-2"><Globe className="w-4 h-4 text-[#E27D60]" /> Country</span>
            <span className="font-black text-[#2e3552] dark:text-white">{country}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-[#9aa3b8] flex items-center gap-2"><User className="w-4 h-4 text-purple-500" /> Age</span>
            <span className="font-black text-[#2e3552] dark:text-white">24 Years</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
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
  );
};
