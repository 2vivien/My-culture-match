import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostImageProps {
  image?: string;
  likes: number;
  liked?: boolean;
  onLike: () => void;
  views: number;
}

export const PostImage = ({ image, likes, liked, onLike, views }: PostImageProps) => {
  if (!image) return null;

  return (
    <div className="relative rounded-[24px] overflow-hidden mb-5 select-none w-full h-[320px] md:h-[400px]">
      <motion.img
        src={image}
        className="w-full h-full object-cover"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
};
