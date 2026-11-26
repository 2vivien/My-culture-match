import React from 'react';
import { motion } from 'framer-motion';
import { Play, VideoOff } from 'lucide-react';
import type { Post } from '@/src/types/post';

interface VideosTabProps {
  posts?: Post[];
}

/**
 * Onglet Vidéos : pour l'instant le produit ne supporte que des posts
 * Images/Text — on affiche les posts avec média (vidéos à venir).
 * Plus aucun mock.
 */
export const VideosTab: React.FC<VideosTabProps> = ({ posts = [] }) => {
  const mediaPosts = posts.filter((p) => Boolean(p.image));

  if (mediaPosts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="bg-white dark:bg-[#161b22] rounded-2xl shadow-sm p-10 border border-gray-100 dark:border-zinc-800/50 flex flex-col items-center gap-3 text-center"
      >
        <VideoOff className="w-8 h-8 text-app-gray" />
        <p className="text-sm font-bold text-app-black dark:text-zinc-200">Aucune vidéo pour le moment</p>
        <p className="text-xs text-app-gray max-w-sm">
          Les contenus vidéo que vous partagerez apparaîtront ici.
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
      <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Médias</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {mediaPosts.map((post) => (
          <div
            key={post.id}
            className="flex flex-col gap-2 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800/50 bg-gray-50/30 dark:bg-zinc-900/40 group"
          >
            <div className="aspect-video relative overflow-hidden bg-zinc-100">
              <img src={post.image} alt={post.text?.slice(0, 60) || 'Média'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Play className="w-10 h-10 text-white fill-current drop-shadow-md" />
              </div>
            </div>
            <div className="p-3">
              <h4 className="font-bold text-xs text-[#2e3552] dark:text-white line-clamp-2">{post.text?.slice(0, 80) || 'Post'}</h4>
              <span className="text-[10px] text-[#9aa3b8]">{post.likes} likes · {post.comments} commentaires</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
