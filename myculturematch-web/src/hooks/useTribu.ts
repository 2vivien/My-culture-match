import { useState, useEffect } from 'react';
import { tribuService } from '@/src/services/tribuService';
import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';

export function useTribu() {
  const [posts, setPosts] = useState<PostItem[]>(() => tribuService.getPosts());
  const [joined, setJoined] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [sortType, setSortType] = useState<'Best' | 'Hot' | 'New'>('Best');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});
  const [mutedPostIds, setMutedPostIds] = useState<Record<string, boolean>>({});

  const rules = tribuService.getRules();
  const moderators = tribuService.getModerators();

  useEffect(() => {
    const handleOutside = () => {
      setOpenMenuPostId(null);
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  const handleFlagClick = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        if (p.hasUpvoted) {
          return { ...p, upvotes: p.upvotes - 1, hasUpvoted: false };
        }
        return { ...p, upvotes: p.upvotes + 1, hasUpvoted: true };
      })
    );
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const submitComment = (postId: string) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return { ...p, commentsCount: p.commentsCount + 1 };
      })
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortType === 'Hot') return b.commentsCount - a.commentsCount;
    if (sortType === 'New') return b.id.localeCompare(a.id); // fallback sort
    return b.upvotes - a.upvotes; // Best
  });

  return {
    joined,
    setJoined,
    notificationsOn,
    setNotificationsOn,
    sortType,
    setSortType,
    commentInputs,
    expandedRule,
    setExpandedRule,
    openMenuPostId,
    setOpenMenuPostId,
    copiedPostId,
    setCopiedPostId,
    savedPostIds,
    setSavedPostIds,
    mutedPostIds,
    setMutedPostIds,
    rules,
    moderators,
    sortedPosts,
    handleFlagClick,
    handleCommentChange,
    submitComment,
  };
}
