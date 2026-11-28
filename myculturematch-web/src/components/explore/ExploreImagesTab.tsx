import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle } from 'lucide-react';
import type { ImagePost } from '@/src/types/explore';

interface ExploreImagesTabProps {
  filteredImages: ImagePost[];
  setLightboxImage: (img: ImagePost) => void;
}

export const ExploreImagesTab: React.FC<ExploreImagesTabProps> = ({
  filteredImages,
  setLightboxImage,
}) => {
  return (
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
          className="aspect-square rounded-[16px] overflow-hidden relative group cursor-pointer border border-app-border dark:border-zinc-800 shadow-sm"
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
                  <Heart className="w-3.5 h-3.5 fill-[#8B4A2B] text-[#8B4A2B]" />
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
  );
};
