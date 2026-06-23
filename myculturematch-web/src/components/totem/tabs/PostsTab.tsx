import React from 'react';
import { motion } from 'framer-motion';
import { PostCard } from '@/src/components/feed/PostCard';
import type { Post } from '@/src/types/post';

interface PostsTabProps {
  user: any;
  posts: Post[];
}

export const PostsTab: React.FC<PostsTabProps> = ({ user, posts }) => {
  const userPosts = posts.filter(p => p.author.id === user.id || p.author.name === user.name);
  const displayPosts = userPosts.length > 0 ? userPosts : [
    {
      id: `post-temp-${user.id}`,
      author: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        location: user.location
      },
      text: `Hello everyone! I'm thrilled to be part of MyCultureMatch. I look forward to exploring ancestral traditions and sharing stories about the ${user.tribes.join(' & ')} tribe! 🌍✨`,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      likes: 124,
      comments: 12,
      views: 530,
      date: 'Today',
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 max-w-2xl mx-auto w-full"
    >
      {displayPosts.map((post) => (
        <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <PostCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
};
