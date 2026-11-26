import React from 'react';
import { Award, Flame, TrendingUp } from 'lucide-react';
import { useTribu } from '@/src/hooks/useTribu';
import { TribuHeader } from '../tribu/TribuHeader';
import { TribuPostCard } from '../tribu/TribuPostCard';
import { TribuAbout } from '../tribu/TribuAbout';
import { TribuRules } from '../tribu/TribuRules';
import { TribuMods } from '../tribu/TribuMods';

export const TribuDetailView: React.FC = () => {
  const {
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
    tribeInfo,
    sortedPosts,
    handleFlagClick,
    handleCommentChange,
    submitComment,
  } = useTribu();

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar select-none bg-zinc-50/50 dark:bg-zinc-950/20 -mx-4 md:-mx-10 px-4 md:px-10 pb-8">
      {/* Banner & controls */}
      <TribuHeader
        joined={joined}
        setJoined={setJoined}
        notificationsOn={notificationsOn}
        setNotificationsOn={setNotificationsOn}
        tribeInfo={tribeInfo}
      />

      {/* Main Grid layout: Left Feed & Right Sidebar Info */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
        {/* Left Column Feed */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Sorting controls Best/Hot/New */}
          <div className="bg-white dark:bg-zinc-900/60 p-2.5 border border-app-border dark:border-zinc-800 rounded-[16px] flex items-center gap-1.5 shadow-xs w-fit">
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
            {sortedPosts.map((post) => (
              <TribuPostCard
                key={post.id}
                post={post}
                tribeName={tribeInfo?.name}
                commentInput={commentInputs[post.id] || ''}
                isMenuOpen={openMenuPostId === post.id}
                isSaved={!!savedPostIds[post.id]}
                isMuted={!!mutedPostIds[post.id]}
                isCopied={copiedPostId === post.id}
                onFlagClick={() => handleFlagClick(post.id)}
                onMenuToggle={(e) => {
                  e.stopPropagation();
                  setOpenMenuPostId(openMenuPostId === post.id ? null : post.id);
                }}
                onSaveToggle={() => {
                  setSavedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                  setOpenMenuPostId(null);
                }}
                onMuteToggle={() => {
                  setMutedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                  setOpenMenuPostId(null);
                }}
                onCopyLink={() => {
                  setCopiedPostId(post.id);
                  navigator.clipboard.writeText(window.location.href);
                  setTimeout(() => {
                    setCopiedPostId(null);
                    setOpenMenuPostId(null);
                  }, 1200);
                }}
                onReport={() => {
                  alert('Thank you for making this community safe. The cultural guardians team will review this post.');
                  setOpenMenuPostId(null);
                }}
                onCommentChange={(text) => handleCommentChange(post.id, text)}
                onCommentSubmit={() => submitComment(post.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
          {/* About Community Card */}
          <TribuAbout tribeInfo={tribeInfo} />

          {/* Tribe Rules Card Accordion */}
          <TribuRules
            rules={rules}
            tribeName={tribeInfo?.name}
            expandedRule={expandedRule}
            setExpandedRule={setExpandedRule}
          />

          {/* Tribe Moderators Card */}
          <TribuMods moderators={moderators} />
        </div>
      </div>
    </div>
  );
};
