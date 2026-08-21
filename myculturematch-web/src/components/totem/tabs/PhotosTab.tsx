import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle } from 'lucide-react';

export const PhotosTab: React.FC = () => {
  const photoUrls = [
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=300&q=80',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="font-black text-[#2e3552] dark:text-white text-lg">All Photos</h3>
        <span className="text-xs font-bold text-[#9aa3b8]">74 Photos</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {photoUrls.map((url, idx) => (
          <div key={url} className="aspect-square rounded-xl overflow-hidden hover:scale-[1.03] transition-transform duration-300 shadow-sm border border-gray-100 dark:border-zinc-800 cursor-pointer relative group">
            <img src={url} alt={`Gallery grid item ${idx}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
              <span className="flex items-center gap-1 text-xs"><Heart className="w-4 h-4 fill-current text-[#E27D60]" /> {24 + idx * 7}</span>
              <span className="flex items-center gap-1 text-xs"><MessageCircle className="w-4 h-4 fill-current text-white" /> {2 + idx}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
