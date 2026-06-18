import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellOff, MoreHorizontal, Plus, Compass, Landmark, Flame, 
  TrendingUp, Sparkles, Award, FlagTriangleLeft, MessageCircle, Shield, Check,
  Bookmark, Share2, AlertTriangle
} from 'lucide-react';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Button } from '@/src/components/ui/button';

interface PostItem {
  id: string;
  author: string;
  timeAgo: string;
  title: string;
  tagText: string;
  tagColor: string;
  mediaUrl?: string;
  upvotes: number;
  commentsCount: number;
  hasUpvoted?: boolean;
}

export const TribuDetailView: React.FC = () => {
  const [joined, setJoined] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [sortType, setSortType] = useState<'Best' | 'Hot' | 'New'>('Best');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  // Three-dots menu states
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});
  const [mutedPostIds, setMutedPostIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleOutside = () => {
      setOpenMenuPostId(null);
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  // Feed posts mock data
  const [posts, setPosts] = useState<PostItem[]>([
    {
      id: 'p1',
      author: 'u/YamatoScholar',
      timeAgo: '6 hr. ago',
      title: 'Day 23 of rebuilding our ancestral Shinto shrine festival using digital sound matching tools',
      tagText: 'Ancestral Match',
      tagColor: 'bg-[#E27D60] text-white',
      mediaUrl: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=800&q=80',
      upvotes: 391,
      commentsCount: 76,
    },
    {
      id: 'p2',
      author: 'u/HakaNavigator',
      timeAgo: '11 days ago',
      title: 'Comparing drum frequencies between Benin Voodoo rhythms and Shinto festival beats: Why they match perfectly',
      tagText: 'Rhythm Study',
      tagColor: 'bg-zinc-700 text-white dark:bg-zinc-650',
      upvotes: 285,
      commentsCount: 32,
    },
  ]);

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar select-none bg-zinc-50/50 dark:bg-zinc-950/20 -mx-4 md:-mx-10 px-4 md:px-10 pb-8">
      {/* 1. Header Banner Image */}
      <div className="relative h-36 md:h-48 rounded-[24px] overflow-hidden bg-[#E27D60] dark:bg-[#c66b50] mt-4 shadow-sm shrink-0">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute inset-0 flex items-center justify-between px-10 select-none pointer-events-none">
          <Landmark className="w-24 h-24 text-white opacity-20 transform -rotate-12" />
          <Compass className="w-20 h-20 text-white opacity-15 transform rotate-45" />
          <Sparkles className="w-28 h-28 text-white opacity-10" />
        </div>
      </div>

      {/* 2. Tribe Info and Controls Bar */}
      <div className="relative px-6 pb-4 border-b border-app-border dark:border-zinc-850 shrink-0 bg-white dark:bg-zinc-900 rounded-b-[24px] shadow-xs">
        <div className="absolute -top-10 left-6">
          <div className="p-1 rounded-full bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 shadow-md">
            <TotemAvatar 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80" 
              alt="Yamato Tribe Logo" 
              size="lg" 
              glow="turquoise" 
              level={21}
            />
          </div>
        </div>

        <div className="pt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-app-black dark:text-zinc-100 flex items-center gap-2">
              t/YamatoTribe
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active matchmaking live" />
            </h2>
            <p className="text-xs text-app-gray dark:text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
              Yamato Ancestral Community
            </p>
          </div>

          {/* Buttons Controls */}
          <div className="flex items-center gap-2 select-none">
            <Button variant="outline" className="text-xs font-black rounded-full px-4.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 dark:border-zinc-850 dark:text-zinc-200">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Create Tradition
            </Button>

            <button
              onClick={() => setNotificationsOn(!notificationsOn)}
              className={`w-9.5 h-9.5 rounded-full border border-app-border dark:border-zinc-800 flex items-center justify-center cursor-pointer transition-colors ${
                notificationsOn 
                  ? 'bg-zinc-50 dark:bg-zinc-850 text-[#E27D60] dark:text-[#E27D60]' 
                  : 'bg-white dark:bg-zinc-900 text-app-gray hover:text-app-black dark:hover:text-zinc-200'
              }`}
              title={notificationsOn ? "Mute notifications" : "Receive notifications"}
            >
              {notificationsOn ? <Bell className="w-4.5 h-4.5" /> : <BellOff className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={() => setJoined(!joined)}
              className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wider transition-all cursor-pointer ${
                joined
                  ? 'bg-[#E4E6EB] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-app-black dark:text-zinc-200'
                  : 'bg-[#E27D60] hover:bg-[#c66b50] text-white shadow-sm'
              }`}
            >
              {joined ? 'Joined' : 'Join'}
            </button>

            <button className="w-9.5 h-9.5 rounded-full border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer bg-white dark:bg-zinc-900">
              <MoreHorizontal className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Grid layout: Left Feed & Right Sidebar Info */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
        {/* Left Column Feed */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Sorting controls Best/Hot/New */}
          <div className="bg-white dark:bg-zinc-900/60 p-2.5 border border-app-border dark:border-zinc-850 rounded-[16px] flex items-center gap-1.5 shadow-xs w-fit">
            {(['Best', 'Hot', 'New'] as const).map((type) => {
              const isActive = sortType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSortType(type)}
                  className={`px-4.5 py-1.5 rounded-full text-xs font-black cursor-pointer tracking-wider flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-[#E27D60] dark:text-[#E27D60]'
                      : 'text-app-gray hover:text-app-black dark:hover:text-zinc-200'
                  }`}
                >
                  {type === 'Best' && <Award className="w-3.5 h-3.5 text-[#E27D60] fill-[#E27D60]" />}
                  {type === 'Hot' && <Flame className="w-3.5 h-3.5 text-[#E27D60] fill-[#E27D60]" />}
                  {type === 'New' && <TrendingUp className="w-3.5 h-3.5 text-[#E27D60]" />}
                  {type}
                </button>
              );
            })}
          </div>

          {/* Posts Feed */}
          <div className="flex flex-col gap-5">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-855 rounded-[20px] p-5 shadow-xs flex flex-col hover:shadow-sm transition-shadow relative"
              >
                {/* Header Row: Flag voting, author info and 3 dots */}
                <div className="flex items-center justify-between border-b border-app-border/40 dark:border-zinc-855 pb-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    {/* Flag voting button */}
                    <button
                      onClick={() => handleFlagClick(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-colors cursor-pointer ${
                        post.hasUpvoted
                          ? 'bg-[#E27D60]/10 border-[#E27D60]/30 text-[#E27D60] dark:bg-[#E27D60]/10 dark:text-[#E27D60] dark:border-[#E27D60]/30'
                          : 'bg-zinc-50 dark:bg-zinc-850 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-zinc-200'
                      }`}
                      title="Add match flag"
                    >
                      <FlagTriangleLeft className={`w-4 h-4 fill-current ${post.hasUpvoted ? 'text-[#E27D60]' : 'text-app-gray'}`} />
                      <span>{post.upvotes}</span>
                    </button>

                    {/* Author & Time */}
                    <div className="flex items-center gap-1.5 text-xs text-app-gray dark:text-zinc-400 font-medium">
                      <span className="font-black text-[#E27D60] dark:text-[#E27D60]">
                        t/YamatoTribe
                      </span>
                      <span>•</span>
                      <span className="font-extrabold text-app-black dark:text-zinc-300">
                        {post.author}
                      </span>
                      <span>•</span>
                      <span>{post.timeAgo}</span>
                    </div>
                  </div>

                  {/* Top-Right Three dots */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuPostId(openMenuPostId === post.id ? null : post.id);
                      }}
                      className="text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center"
                    >
                      <MoreHorizontal className="w-4.5 h-4.5" />
                    </button>
                    <AnimatePresence>
                      {openMenuPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-7 w-52 bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-855 rounded-2xl shadow-xl overflow-hidden z-55 p-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setSavedPostIds(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                              setOpenMenuPostId(null);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Bookmark className="w-4 h-4 text-app-gray" />
                              {savedPostIds[post.id] ? 'Tradition Saved!' : 'Save this Tradition'}
                            </span>
                            {savedPostIds[post.id] && <Check className="w-3.5 h-3.5 text-[#E27D60]" />}
                          </button>

                          <button
                            onClick={() => {
                              setCopiedPostId(post.id);
                              navigator.clipboard.writeText(window.location.href);
                              setTimeout(() => {
                                setCopiedPostId(null);
                                setOpenMenuPostId(null);
                              }, 1200);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Share2 className="w-4 h-4 text-app-gray" />
                              {copiedPostId === post.id ? 'Copied Link!' : 'Copy Link'}
                            </span>
                            {copiedPostId === post.id && <Check className="w-3.5 h-3.5 text-[#E27D60]" />}
                          </button>

                          <button
                            onClick={() => {
                              setMutedPostIds(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                              setOpenMenuPostId(null);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <BellOff className={`w-4 h-4 ${mutedPostIds[post.id] ? 'text-[#E27D60]' : 'text-app-gray'}`} />
                              {mutedPostIds[post.id] ? 'Muted Author' : 'Mute Notifications'}
                            </span>
                            {mutedPostIds[post.id] && <Check className="w-3.5 h-3.5 text-[#E27D60]" />}
                          </button>

                          <div className="border-t border-app-border/60 dark:border-zinc-850/60 my-1" />

                          <button
                            onClick={() => {
                              alert('Thank you for making this community safe. The cultural guardians team will review this traditional transmission.');
                              setOpenMenuPostId(null);
                            }}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#E27D60] dark:text-[#E27D60] hover:bg-[#E27D60]/10 dark:hover:bg-[#E27D60]/20 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Report Content</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Main Post Text & Title */}
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base text-app-black dark:text-zinc-100 leading-snug">
                    {post.title}
                  </h3>
                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-2.5 ${post.tagColor}`}>
                    {post.tagText}
                  </span>

                  {/* Optional Image Media */}
                  {post.mediaUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-app-border dark:border-zinc-800 max-h-96">
                      <img
                        src={post.mediaUrl}
                        alt="Post Attachment"
                        className="w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Direct Comment Box at the bottom of the card */}
                  <div className="mt-4.5 pt-4 border-t border-app-border/40 dark:border-zinc-850 flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-app-gray dark:text-zinc-400 font-bold">
                      <MessageCircle className="w-4 h-4 text-app-gray dark:text-zinc-400" />
                      <span>{post.commentsCount} comments shared</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        placeholder="Write a comment beat..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitComment(post.id);
                        }}
                        className="flex-1 px-4 py-2 text-xs rounded-xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-150 focus:outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]"
                      />
                      <button
                        onClick={() => submitComment(post.id)}
                        className="p-2 bg-[#E27D60] hover:bg-[#c66b50] text-white rounded-xl cursor-pointer transition-colors flex items-center justify-center shrink-0 w-8.5 h-8.5"
                        title="Send comment"
                      >
                        <MessageCircle className="w-4.5 h-4.5 fill-current text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
          {/* About Community Card */}
          <div className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-855 rounded-[20px] p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-app-black dark:text-zinc-200">
              About YamatoTribe
            </h3>
            <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed mt-2.5">
              This is the Yamato Tribe discussion hub to help you discover ancestral traditions, Yamato dialects, and historical celebrations passed down through generations.
            </p>

            {/* Created info */}
            <div className="mt-4 pt-3 border-t border-app-border/70 dark:border-zinc-800 text-[11px] text-app-gray dark:text-zinc-400 font-bold flex justify-between">
              <span>Created Jan 23, 2023</span>
              <span className="text-[#E27D60] dark:text-[#E27D60]">Public Hub</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 mt-5 pt-3 border-t border-app-border/70 dark:border-zinc-800">
              <div>
                <span className="font-black text-base text-app-black dark:text-zinc-100">
                  2.1M
                </span>
                <p className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase mt-0.5">
                  Weekly visitors
                </p>
              </div>
              <div>
                <span className="font-black text-base text-app-black dark:text-zinc-100">
                  44K
                </span>
                <p className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase mt-0.5">
                  Contributions
                </p>
              </div>
            </div>

            {/* Guide button */}
            <button className="w-full text-xs font-black rounded-xl py-2.5 mt-5 bg-[#E27D60] hover:bg-[#c66b50] text-white shadow-xs transition-colors cursor-pointer">
              View Tribe Guide
            </button>
          </div>

          {/* Tribe Rules Card Accordion */}
          <div className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-850 rounded-[20px] p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-app-black dark:text-zinc-200 mb-3 border-b border-app-border/40 dark:border-zinc-850 pb-2">
              t/YamatoTribe Rules
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { number: 1, title: 'Respect Ancestral Heritage', desc: 'No mockery of sacred rites or Shinto rituals.' },
                { number: 2, title: 'Keep Dialects Authentic', desc: 'Share genuine linguistic accounts.' },
                { number: 3, title: 'Constructive Matching', desc: 'Promote healthy matches across tribes.' },
                { number: 4, title: 'No Spam or Self-Promotion', desc: 'Keep the hub educational and heritage-focused.' },
              ].map((rule) => {
                const isExpanded = expandedRule === rule.number;
                return (
                  <div key={rule.number} className="text-xs border-b border-app-border/20 dark:border-zinc-800/40 pb-2.5 last:border-b-0 last:pb-0">
                    <button
                      onClick={() => setExpandedRule(isExpanded ? null : rule.number)}
                      className="w-full text-left font-black text-app-black dark:text-zinc-200 hover:text-[#E27D60] dark:hover:text-[#E27D60] cursor-pointer flex items-center justify-between py-1 transition-colors"
                    >
                      <span>{rule.number}. {rule.title}</span>
                      <span className="text-app-gray text-[9px] font-bold">{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                      className="overflow-hidden"
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-[10.5px] text-app-gray dark:text-zinc-400 mt-1 leading-snug pt-0.5">
                        {rule.desc}
                      </p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tribe Moderators Card */}
          <div className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-850 rounded-[20px] p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-app-black dark:text-zinc-200 mb-4 border-b border-app-border/40 dark:border-zinc-850 pb-2 flex items-center gap-1.5">
              <Shield className="w-4.5 h-4.5 text-[#E27D60] dark:text-[#E27D60]" />
              Tribe Moderators
            </h3>
            <div className="flex flex-col gap-3.5">
              {[
                { name: 'u/YamatoElder', role: 'Head Elder', avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=50&q=80' },
                { name: 'u/TotemNavigator', role: 'Synergy Guide', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=50&q=80' },
                { name: 'u/AinuFolkloreDev', role: 'Inter-Tribe Mod', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=50&q=80' },
              ].map((mod) => (
                <div key={mod.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TotemAvatar src={mod.avatar} alt={mod.name} size="xs" glow="none" />
                    <span className="font-extrabold text-app-black dark:text-zinc-200">
                      {mod.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase">
                    {mod.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
