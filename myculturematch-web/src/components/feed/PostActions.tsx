import { useState } from 'react';
import { Smile, Send } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { Avatar } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';

export const PostActions = () => {
  const { currentUser } = useAppStore();
  const [comment, setComment] = useState('');

  const handleSendComment = () => {
    if (!comment.trim()) return;
    setComment('');
  };

  return (
    <div className="flex items-center justify-between pt-2 border-t border-app-border select-none w-full">
      <div className="flex items-center w-full gap-3 relative">
        <Avatar src={currentUser?.avatar} alt={currentUser?.name} size="sm" />
        <div className="flex-1 bg-[#FCFCFC] rounded-full px-4 py-2.5 flex items-center border border-app-border focus-within:ring-1 focus-within:ring-app-black/5 transition-all">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder="Write a comment..."
            className="bg-transparent border-none text-sm w-full focus:ring-0 outline-none placeholder-app-gray"
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
          className="w-10 h-10 bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </Button>
      </div>
    </div>
  );
};
