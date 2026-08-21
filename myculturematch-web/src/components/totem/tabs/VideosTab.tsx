import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export const VideosTab: React.FC = () => {
  const videos = [
    { title: 'Gaming Room Tour & Setup Review', views: '1.2K views', duration: '12:45', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80' },
    { title: 'Ancestral Myths - Quechua Mythology', views: '840 views', duration: '24:15', thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80' },
    { title: 'Voodoo Dance Ceremonies in Benin', views: '2.1K views', duration: '18:10', thumb: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4"
    >
      <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Featured Videos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.title} className="flex flex-col gap-2 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800/50 bg-gray-50/30 dark:bg-zinc-900/40 group cursor-pointer">
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
  );
};
