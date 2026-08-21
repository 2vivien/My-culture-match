import React from 'react';
import { motion } from 'framer-motion';
import { ArchiveRestore } from 'lucide-react';

interface TraditionsTabProps {
  user: any;
}

export const TraditionsTab: React.FC<TraditionsTabProps> = ({ user }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {/* Tribes & Traditions Stats Box */}
      <div className="md:col-span-1 bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 flex flex-col gap-4 border border-gray-100 dark:border-zinc-800/50">
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
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-[#9aa3b8]">Traditions Unlocked</span>
            <span className="text-[#2e3552] dark:text-white font-black">{user.traditionsCount || 18}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 dark:border-zinc-800 pb-2">
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
          {user.tribes.map((tribe: string, idx: number) => (
            <div 
              key={tribe} 
              className="p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-gray-100 dark:border-zinc-800/50 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all group"
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
  );
};
