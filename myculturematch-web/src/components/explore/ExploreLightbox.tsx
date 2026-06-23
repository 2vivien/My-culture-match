import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, ExternalLink } from 'lucide-react';
import type { ImagePost } from '@/src/types/explore';

interface ExploreLightboxProps {
  lightboxImage: ImagePost | null;
  setLightboxImage: (img: ImagePost | null) => void;
}

export const ExploreLightbox: React.FC<ExploreLightboxProps> = ({
  lightboxImage,
  setLightboxImage,
}) => {
  return (
    <AnimatePresence>
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="bg-black border border-zinc-900 rounded-[28px] overflow-hidden max-w-3xl w-full flex flex-col shadow-2xl relative"
          >
            {/* Image window */}
            <div className="aspect-[4/3] w-full bg-zinc-950 flex items-center justify-center relative">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="w-full h-full object-contain"
              />

              {/* Top Actions (Close only) */}
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 hover:scale-105 transition-all text-white flex items-center justify-center cursor-pointer border border-white/10"
              >
                ✕
              </button>
            </div>

            {/* Description Panel */}
            <div className="p-6 bg-zinc-950 border-t border-zinc-900 text-white">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#E27D60] tracking-wider">
                    {lightboxImage.category}
                  </span>
                  <h3 className="font-black text-lg mt-1 tracking-tight leading-snug">
                    {lightboxImage.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3.5 text-xs font-black shrink-0 pt-1">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                    <Heart className="w-4 h-4 fill-[#E27D60] text-[#E27D60]" />
                    {lightboxImage.likes}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                    <MessageCircle className="w-4 h-4 fill-white" />
                    {lightboxImage.comments}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-between items-center text-zinc-400 text-xs">
                <span>Partagé avec la communauté MyCultureMatch</span>
                <button className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors text-xs font-bold">
                  View original <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
