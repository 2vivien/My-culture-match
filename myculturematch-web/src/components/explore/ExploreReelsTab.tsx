import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  MoreHorizontal,
  Camera,
  ChevronLeft,
} from 'lucide-react';
import { IconBrandParsinta } from '@tabler/icons-react';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { useFeed } from '@/src/hooks/useFeed';
import type { Post } from '@/src/types/post';

/**
 * Onglet "Reels" de la page Explorer — style Instagram :
 *  - lecteur vertical plein écran (snap scroll entre les vidéos) ;
 *  - icône Tabler IconBrandParsinta (ti-brand-parsinta) comme identité Reels ;
 *  - rail d'actions à droite (like, commentaire, partage, save, menu) ;
 *  - header auteur + Follow, caption, barre "Add a comment".
 */
export const ExploreReelsTab: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { posts } = useFeed();
  const reels = posts.filter((p) => Boolean(p.image));
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Quel reel est visible (scroll snap)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex(Math.min(idx, Math.max(reels.length - 1, 0)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [reels.length]);

  if (reels.length === 0) {
    return (
      <motion.div
        key="reels-empty"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
          <IconBrandParsinta className="w-8 h-8 text-app-gray" />
        </div>
        <h3 className="font-extrabold text-app-black dark:text-white">No reels yet</h3>
        <p className="text-sm text-app-gray mt-1 max-w-sm">
          When people share videos, they will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="reels-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center"
    >
      {/* Téléphone : colonne de reels plein écran */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[420px] h-[calc(100dvh-190px)] min-h-[560px] rounded-[28px] overflow-hidden bg-black shadow-2xl snap-y snap-mandatory overflow-y-auto hide-scrollbar no-scrollbar"
      >
        {reels.map((reel: Post, idx: number) => {
          const isLiked = !!liked[reel.id];
          const isSaved = !!saved[reel.id];
          return (
            <div key={reel.id} className="relative w-full h-full snap-start snap-always">
              {/* Média */}
              <img
                src={reel.image}
                alt={reel.title ?? ''}
                className="absolute inset-0 w-full h-full object-cover select-none"
                loading={idx <= 1 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

              {/* Header auteur (comme Instagram) */}
              <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  {onBack ? (
                    <button onClick={onBack} className="text-white/90 hover:text-white cursor-pointer bg-transparent border-none p-0">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  ) : (
                    <ProfileAvatar
                      src={reel.author.avatar}
                      alt={reel.author.name}
                      size="xs"
                      shape="circle"
                      glow="none"
                    />
                  )}
                  <span className="text-white font-bold text-sm drop-shadow-md">{reel.author.username}</span>
                  <button className="ml-1 px-3 py-1 rounded-md border border-white/70 text-white text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer bg-transparent">
                    Follow
                  </button>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <IconBrandParsinta className="w-6 h-6 drop-shadow-md" />
                  <Camera className="w-5.5 h-5.5 drop-shadow-md" />
                </div>
              </div>

              {/* Caption + son */}
              <div className="absolute bottom-0 inset-x-0 p-4 pr-20 z-10">
                <p className="text-white text-sm leading-snug drop-shadow-md line-clamp-2">
                  <span className="font-bold">{reel.author.username}</span>{' '}
                  {reel.title ?? reel.text}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-white/90">
                  <IconBrandParsinta className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Original sound — {reel.author.name}</span>
                </div>
              </div>

              {/* Rail d'actions à droite (comme Instagram) */}
              <div className="absolute right-2.5 bottom-6 z-10 flex flex-col items-center gap-5">
                <button
                  onClick={() => setLiked((p) => ({ ...p, [reel.id]: !p[reel.id] }))}
                  className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                >
                  <Heart
                    className={`w-7 h-7 drop-shadow-md transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`}
                  />
                  <span className="text-white text-[10px] font-bold drop-shadow-md">
                    {reel.likes + (isLiked ? 1 : 0)}
                  </span>
                </button>

                <button className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none p-0">
                  <MessageCircle className="w-7 h-7 text-white drop-shadow-md" />
                  <span className="text-white text-[10px] font-bold drop-shadow-md">{reel.comments}</span>
                </button>

                <button className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none p-0">
                  <Send className="w-7 h-7 text-white drop-shadow-md" />
                  <span className="text-white text-[10px] font-bold drop-shadow-md">Share</span>
                </button>

                <button
                  onClick={() => setSaved((p) => ({ ...p, [reel.id]: !p[reel.id] }))}
                  className="cursor-pointer bg-transparent border-none p-0"
                >
                  <Bookmark
                    className={`w-7 h-7 drop-shadow-md ${isSaved ? 'fill-white text-white' : 'text-white'}`}
                  />
                </button>

                <button className="cursor-pointer bg-transparent border-none p-0">
                  <MoreHorizontal className="w-6 h-6 text-white drop-shadow-md" />
                </button>

                {/* Miniature du son (comme Instagram) */}
                <div className="w-7 h-7 rounded-md border border-white/70 overflow-hidden rotate-3">
                  <img src={reel.author.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* Barre "Add a comment" (comme Instagram) */}
              {idx === activeIndex && (
                <div className="absolute bottom-2 right-20 left-4 z-10">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 rounded-full px-4 py-2">
                    <span className="text-white/80 text-sm">☺</span>
                    <span className="text-white/70 text-sm font-medium flex-1">Add a comment…</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Indicateurs de position (points) */}
      <div className="flex items-center gap-1.5 mt-3">
        {reels.slice(0, 8).map((r, i) => (
          <span
            key={r.id}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-app-black dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          />
        ))}
      </div>
    </motion.div>
  );
};
