import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostImageProps {
  image?: string;
  likes: number;
  onLike: () => void;
  views: number;
}

export const PostImage = ({ image, likes, onLike, views }: PostImageProps) => {
  if (!image) return null;

  return (
    <div className="relative rounded-[24px] overflow-hidden mb-5 select-none w-full h-[320px] md:h-[400px]">
      <motion.img
        src={image}
        className="w-full h-full object-cover"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={(e) => {
          e.stopPropagation();
          onLike();
        }}
        className="absolute bottom-4 left-4 bg-red-500 text-white rounded-2xl px-4 py-2 flex items-center gap-2 shadow-md hover:bg-red-600 transition-colors backdrop-blur-sm bg-opacity-90 cursor-pointer"
      >
        <Heart className="w-4 h-4 fill-current" />
        <span className="font-bold text-sm">{likes}</span>
      </motion.button>

      <div className="absolute bottom-4 right-4 bg-white text-app-black rounded-2xl px-4 py-2 flex items-center gap-2 shadow-md">
        <div className="w-2 h-2 bg-app-black rounded-full" />
        <span className="font-bold text-sm">{views || 999}</span>
      </div>
    </div>
  );
};
