import React from 'react';
import { Award, Flame, TrendingUp } from 'lucide-react';
import { useTribu } from '@/src/hooks/useTribu';
import { TribuHeader } from '../tribu/TribuHeader';
import { TribuPostCard } from '../tribu/TribuPostCard';
import { TribuAbout } from '../tribu/TribuAbout';
import { TribuRules } from '../tribu/TribuRules';
import { TribuMods } from '../tribu/TribuMods';
import { TribuPrivateNotice } from '../tribu/TribuPrivateNotice';
import { TribuFlairBar } from '../tribu/TribuFlairBar';
import { TribuJoinRequests } from '../tribu/TribuJoinRequests';

/** Libellés français des tris (les valeurs internes restent celles du hook). */
const SORT_LABELS = { Best: 'Meilleurs', Hot: 'Tendance', New: 'Récents', Controversial: 'Controversés' } as const;

export const TribuDetailView: React.FC = () => {
  const {
    isMod,
    visibility,
    joinAction,
    runJoinAction,
    membershipPending,
    feedback,
    clearFeedback,
    contentLocked,
    postsLoading,
    postsFailed,
    refetchPosts,
    flairs,
    flairFilter,
    setFlairFilter,
    createFlair,
    creatingFlair,
    deleteFlair,
    deletingFlairId,
    setPostFlair,
    joinRequests,
    joinRequestsLoading,
    joinRequestsError,
    refetchJoinRequests,
    resolveJoinRequest,
    resolvingUserId,
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
        joinAction={joinAction}
        onJoinAction={runJoinAction}
        membershipPending={membershipPending}
        notificationsOn={notificationsOn}
        setNotificationsOn={setNotificationsOn}
        tribeInfo={tribeInfo}
      />

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-2xl border px-4 py-3 text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={clearFeedback} aria-label="Fermer le message" className="cursor-pointer text-current opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Main Grid layout: Left Feed & Right Sidebar Info */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
        {/* Left Column Feed */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {contentLocked ? (
            <TribuPrivateNotice
              joinAction={joinAction}
              onJoinAction={runJoinAction}
              membershipPending={membershipPending}
            />
          ) : (
          <>
          <TribuFlairBar
            flairs={flairs}
            activeFlairId={flairFilter}
            onSelect={setFlairFilter}
            canManage={isMod}
            onCreate={createFlair}
            creating={creatingFlair}
            onDelete={deleteFlair}
            deletingId={deletingFlairId}
          />

          {/* Tri : Meilleurs / Tendance / Récents / Controversés */}
          <div role="group" aria-label="Trier les publications" className="bg-white dark:bg-zinc-900/60 p-2.5 border border-app-border dark:border-zinc-800 rounded-[16px] flex items-center gap-1.5 shadow-xs w-fit">
            {(['Best', 'Hot', 'New', 'Controversial'] as const).map((type) => {
              const isActive = sortType === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={isActive}
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
                  {SORT_LABELS[type]}
                </button>
              );
            })}
          </div>

          {/* Posts Feed */}
          <div className="flex flex-col gap-5" aria-busy={postsLoading}>
            {postsLoading && (
              <div role="status" className="flex flex-col gap-3" aria-label="Chargement des publications">
                {[0, 1].map((i) => (
                  <div key={i} className="h-32 rounded-[20px] bg-zinc-100 dark:bg-zinc-900/60 animate-pulse" />
                ))}
              </div>
            )}

            {postsFailed && (
              <div role="alert" className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[20px] p-6 text-center flex flex-col items-center gap-3">
                <p className="text-xs font-bold text-red-600 dark:text-red-400">Impossible de charger les publications.</p>
                <button
                  type="button"
                  onClick={() => refetchPosts()}
                  className="px-4 py-2 rounded-full bg-[#E27D60] hover:bg-[#c66b50] text-white text-xs font-black cursor-pointer"
                >
                  Réessayer
                </button>
              </div>
            )}

            {!postsLoading && !postsFailed && sortedPosts.length === 0 && (
              <div className="bg-white dark:bg-zinc-900/60 border border-dashed border-app-border dark:border-zinc-700 rounded-[20px] p-8 text-center text-xs font-semibold text-app-gray dark:text-zinc-400">
                {flairFilter
                  ? 'Aucune publication avec ce flair.'
                  : 'Aucune publication pour l’instant dans cette tribu.'}
              </div>
            )}

            {sortedPosts.map((post) => (
              <TribuPostCard
                key={post.id}
                post={post}
                flairs={isMod ? flairs : undefined}
                onSetFlair={isMod ? (flairId) => setPostFlair(post.id, flairId) : undefined}
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
                  alert('Thank you for making this community safe. The cultural guardians team will review this traditional transmission.');
                  setOpenMenuPostId(null);
                }}
                onCommentChange={(text) => handleCommentChange(post.id, text)}
                onCommentSubmit={() => submitComment(post.id)}
              />
            ))}
          </div>
          </>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
          {isMod && visibility === 'private' && (
            <TribuJoinRequests
              requests={joinRequests}
              loading={joinRequestsLoading}
              error={joinRequestsError}
              onRetry={() => refetchJoinRequests()}
              onResolve={resolveJoinRequest}
              resolvingUserId={resolvingUserId}
            />
          )}

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
