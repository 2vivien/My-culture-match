import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { VideoPost } from '@/src/types/explore';

interface ExploreVideosTabProps {
  filteredVideos: VideoPost[];
}

export const ExploreVideosTab: React.FC<ExploreVideosTabProps> = ({ filteredVideos }) => {
  return (
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
          className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[20px] overflow-hidden relative group shadow-sm flex flex-col"
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
              <div className="w-12 h-12 rounded-full bg-white/95 dark:bg-zinc-900/95 flex items-center justify-center text-app-black dark:text-zinc-100 shadow-md transform group-hover:scale-105 transition-transform">
                <Play className="w-5 h-5 fill-current text-app-black dark:text-zinc-100 translate-x-[2px]" />
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
  );
};
