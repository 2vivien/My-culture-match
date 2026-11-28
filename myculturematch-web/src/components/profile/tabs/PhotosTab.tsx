import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, ImageOff } from 'lucide-react';
import type { Post } from '@/src/types/post';

interface PhotosTabProps {
  posts?: Post[];
}

/**
 * Galerie Photos : uniquement les vrais posts de type Images de l'utilisateur.
 */
export const PhotosTab: React.FC<PhotosTabProps> = ({ posts = [] }) => {
  const photoPosts = posts.filter((p) => Boolean(p.image));

  if (photoPosts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-10 border border-gray-100 dark:border-zinc-800/50 flex flex-col items-center gap-3 text-center"
      >
        <ImageOff className="w-8 h-8 text-app-gray" />
        <p className="text-sm font-bold text-app-black dark:text-zinc-200">Aucune photo pour le moment</p>
        <p className="text-xs text-app-gray max-w-sm">
          Les photos que vous partagez dans vos posts apparaîtront ici.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="font-black text-[#2e3552] dark:text-white text-lg">All Photos</h3>
        <span className="text-xs font-bold text-[#9aa3b8]">{photoPosts.length} Photos</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {photoPosts.map((post) => (
          <div
            key={post.id}
            className="aspect-square rounded-xl overflow-hidden hover:scale-[1.03] transition-transform duration-300 shadow-sm border border-gray-100 dark:border-zinc-800 cursor-pointer relative group"
          >
            <img src={post.image} alt={post.text?.slice(0, 60) || 'Photo'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
              <span className="flex items-center gap-1 text-xs">
                <Heart className="w-4 h-4 fill-current text-[#8B4A2B]" /> {post.likes}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <MessageCircle className="w-4 h-4 fill-current text-white" /> {post.comments}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
