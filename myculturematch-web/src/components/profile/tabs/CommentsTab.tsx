import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { api } from '@/src/services/api';
import { useAppStore } from '@/src/stores/useAppStore';
import type { Post } from '@/src/types/post';

interface CommentsTabProps {
  user: any;
  posts: Post[];
}

interface UserComment {
  id: string;
  text: string;
  createdAt: string;
  postTitle: string;
}

export const CommentsTab: React.FC<CommentsTabProps> = ({ user, posts }) => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const ownPosts = posts.filter((post) => post.author.id === user.id).slice(0, 8);
  const postsKey = ownPosts.map((post) => post.id).join(',');

  const { data: comments = [], isLoading } = useQuery<UserComment[]>({
    queryKey: ['profile-comments', user.id, postsKey],
    enabled: ownPosts.length > 0 && isAuthenticated,
    queryFn: async () => {
      const groups = await Promise.all(
        ownPosts.map(async (post) => {
          const data = await api.get<{
            comments: Array<{
              id: string;
              text: string;
              createdAt: string;
              author: { id: string };
            }>;
          }>(`/api/posts/${post.id}/comments?limit=50`);
          return (data.comments ?? [])
            .filter((comment) => comment.author.id === user.id)
            .map((comment) => ({
              id: comment.id,
              text: comment.text,
              createdAt: comment.createdAt,
              postTitle: post.title || post.text || 'Post',
            }));
        }),
      );
      return groups
        .flat()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);
    },
    staleTime: 1000 * 60 * 2,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto w-full"
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-700 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 text-center">
          <MessageCircle className="w-7 h-7 mx-auto mb-3 text-zinc-400" />
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">No comments yet</p>
          <p className="text-xs text-zinc-500 mt-1">Comments you write on posts will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {comments.map((comment) => (
            <div key={comment.id} className="py-4">
              <p className="text-sm text-zinc-800 dark:text-zinc-100">{comment.text}</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                on “{comment.postTitle}” · {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
