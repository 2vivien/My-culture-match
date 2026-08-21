import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tribuService } from '@/src/services/tribuService';
import { useAppStore } from '@/src/stores/useAppStore';
import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';

export function useTribu() {
  const tribeId = useAppStore((s) => s.selectedTribeId);
  const [joined, setJoined] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [sortType, setSortType] = useState<'Best' | 'Hot' | 'New'>('Best');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});
  const [mutedPostIds, setMutedPostIds] = useState<Record<string, boolean>>({});

  const { data: posts = [] } = useQuery<PostItem[]>({
    queryKey: ['tribu-posts', tribeId],
    queryFn: () => tribuService.fetchPosts(tribeId ?? undefined),
    staleTime: 1000 * 60 * 5,
    enabled: !!tribeId,
  });

  const { data: rules = [] } = useQuery<TribeRule[]>({
    queryKey: ['tribu-rules', tribeId],
    queryFn: () => tribuService.fetchRules(tribeId ?? undefined),
    staleTime: 1000 * 60 * 10,
    enabled: !!tribeId,
  });

  const { data: moderators = [] } = useQuery<TribeModerator[]>({
    queryKey: ['tribu-moderators', tribeId],
    queryFn: () => tribuService.fetchModerators(tribeId ?? undefined),
    staleTime: 1000 * 60 * 10,
    enabled: !!tribeId,
  });

  useEffect(() => {
    const handleOutside = () => {
      setOpenMenuPostId(null);
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  const [localPosts, setLocalPosts] = useState<PostItem[]>([]);
  const effectivePosts = localPosts.length > 0 ? localPosts : posts;

  const handleFlagClick = (postId: string) => {
    setLocalPosts((prev) => {
      const base = prev.length > 0 ? prev : posts;
      return base.map((p) => {
        if (p.id !== postId) return p;
        if (p.hasUpvoted) {
          return { ...p, upvotes: p.upvotes - 1, hasUpvoted: false };
        }
        return { ...p, upvotes: p.upvotes + 1, hasUpvoted: true };
      });
    });
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const submitComment = (postId: string) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const sortedPosts = [...effectivePosts].sort((a, b) => {
    if (sortType === 'Hot') return b.commentsCount - a.commentsCount;
    if (sortType === 'New') return b.id.localeCompare(a.id);
    return b.upvotes - a.upvotes;
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
