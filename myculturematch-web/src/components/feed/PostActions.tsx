import { useState } from 'react';
import { Smile, Send, FlagTriangleLeft, MessageCircle } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { Avatar } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';

interface PostActionsProps {
  likes: number;
  liked?: boolean;
  onLike: () => void;
}

export const PostActions = ({ likes, liked, onLike }: PostActionsProps) => {
  const { currentUser } = useAppStore();
  const [comment, setComment] = useState('');

  const handleSendComment = () => {
    if (!comment.trim()) return;
    setComment('');
  };

  const formatLikes = (num: number) => {
    if (num >= 10000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`.replace('.0', '');
    }
    return num;
  };

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-app-border select-none w-full">
      <div className="flex items-center justify-end gap-4 text-app-gray px-2">
        <button 
          onClick={onLike} 
          className={`flex items-center gap-1.5 transition-colors font-semibold text-sm cursor-pointer ${liked ? 'text-[#E27D60]' : 'hover:text-[#E27D60] text-app-gray'}`}
        >
          <FlagTriangleLeft className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>{likes === 0 ? 'flag' : formatLikes(likes)}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-[#E27D60] transition-colors font-semibold text-sm cursor-pointer">
          <MessageCircle className="w-5 h-5" />
          <span>comment</span>
        </button>
      </div>

      <div className="flex items-center w-full gap-3 relative mt-1">
        <Avatar src={currentUser?.avatar} alt={currentUser?.name} size="sm" />
        <div className="flex-1 bg-[#FCFCFC] dark:bg-zinc-900 rounded-full px-4 py-2.5 flex items-center border border-app-border focus-within:ring-1 focus-within:ring-[#E27D60]/20 transition-all">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder="Write a comment..."
            className="bg-transparent border-none text-sm w-full focus:ring-0 outline-none placeholder-app-gray dark:text-zinc-300"
          />
          <Button
            variant="ghost"
            className="p-1.5 text-app-gray hover:text-yellow-500 hover:bg-transparent cursor-pointer rounded-full min-w-0"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>
        <Button
          onClick={handleSendComment}
          disabled={!comment.trim()}
          size="icon"
          className="w-10 h-10 bg-[#E27D60] text-white hover:bg-[#c66b50] hover:scale-105"
        >
          <MessageCircle className="w-4.5 h-4.5 text-white" />
        </Button>
      </div>
    </div>
  );
};
