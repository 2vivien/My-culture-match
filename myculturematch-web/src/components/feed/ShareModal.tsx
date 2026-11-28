import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Link2, Check, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/src/services/chat.service';
import { connectionsService } from '@/src/services/connectionsService';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { useAppStore } from '@/src/stores/useAppStore';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface ShareModalProps {
  open: boolean;
  /** Texte de partage (lien du post + titre éventuel). */
  shareUrl: string;
  shareText?: string;
  onClose: () => void;
}

/**
 * Popup "Partager" — inspirée du screenshot : recherche, grille d'amis
 * (envoi du post en message privé), puis rangée d'icônes de partage externes
 * (Copier le lien, Facebook, Messenger, WhatsApp, Email, Threads, X).
 */
export const ShareModal: React.FC<ShareModalProps> = ({ open, shareUrl, shareText, onClose }) => {
  const meId = useAppStore((s) => s.currentUser.id);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sentTo, setSentTo] = useState<Record<string, 'sending' | 'sent'>>({});

  // Amis = compagnons (backend). Fallback : participants aux conversations.
  const { data: friends = [] } = useQuery<ConnectionUser[]>({
    queryKey: ['friends-for-share'],
    queryFn: async () => {
      try {
        const companions = await connectionsService.getCompanions();
        if (companions.length > 0) return companions;
      } catch {
        // fallback conversations
      }
      const convos = await chatService.getConversations();
      return convos.map((c) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        matchScore: 0,
        country: c.country,
        countryFlag: '🌍',
        countryCode: '',
        interestedCount: 0,
        compagnonsCount: 0,
      }));
    },
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (open) {
      setSentTo({});
      setSearch('');
    }
  }, [open]);

  const shareMutation = useMutation({
    mutationFn: async (friend: { id: string; name: string }) => {
      // id de conversation si fallback, sinon userId → conversation 1:1
      const isConversationId = friend.id.length === 32 && !friend.id.includes('-');
      let conversationId = friend.id;
      if (!isConversationId) {
        const conv = await chatService.ensureConversationWith(friend.id);
        conversationId = conv.id;
      }
      const text = shareText ? `${shareText}\n${shareUrl}` : shareUrl;
      return chatService.sendMessage(conversationId, text);
    },
    onSuccess: (_result, friend) => {
      setSentTo((prev) => ({ ...prev, [friend.id]: 'sent' }));
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (_err, friend) => {
      setSentTo((prev) => {
        const next = { ...prev };
        delete next[friend.id];
        return next;
      });
    },
  });

  const filtered = friends.filter((f) =>
    f.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const socials = [
    {
      label: 'Copier le lien',
      icon: <Link2 className="w-6 h-6 text-app-black dark:text-zinc-200" />,
      onClick: () => {
        navigator.clipboard.writeText(shareUrl).catch(() => undefined);
        setSentTo((prev) => ({ ...prev, __copied: 'sent' }));
        setTimeout(() => setSentTo((prev) => {
          const next = { ...prev };
          delete next.__copied;
          return next;
        }), 1500);
      },
    },
    {
      label: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1877F2">
          <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
        </svg>
      ),
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
    },
    {
      label: 'Messenger',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#00B2FF">
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.15.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.53-.04 1.15.32 2.37.48 3.66.48 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm5.86 7.36-2.72 4.31c-.44.69-1.38.86-2.03.37l-2.17-1.62a.48.48 0 0 0-.58 0l-2.93 2.23c-.39.3-.9-.17-.64-.6l2.72-4.31c.44-.69 1.38-.86 2.03-.37l2.17 1.62c.17.13.41.13.58 0l2.93-2.23c.39-.3.9.17.64.6Z" />
        </svg>
      ),
      onClick: () => window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=0&redirect_uri=${encodeURIComponent(window.location.origin)}`, '_blank'),
    },
    {
      label: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#25D366">
          <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.16L2.1 22l4.96-1.5A9.9 9.9 0 1 0 12.04 2Zm5.77 14.02c-.24.68-1.4 1.3-1.93 1.35-.5.05-.97.23-3.27-.68-2.76-1.09-4.51-3.93-4.65-4.11-.14-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .96-2.27.25-.27.55-.34.73-.34l.53.01c.17.01.4-.06.62.47.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.09.18-.5.75-.68.97-.13.16-.27.34-.09.65.18.3.8 1.31 1.71 2.12 1.17 1.04 2.16 1.37 2.47 1.52.3.16.48.13.66-.08.18-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.7.8 2 .95.29.14.48.21.56.33.07.13.07.75-.17 1.43Z" />
        </svg>
      ),
      onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText ?? ''} ${shareUrl}`.trim())}`, '_blank'),
    },
    {
      label: 'Email',
      icon: (
        <span className="w-7 h-7 rounded-full border-2 border-app-gray flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-app-gray" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </span>
      ),
      onClick: () => window.open(`mailto:?subject=${encodeURIComponent(shareText ?? 'Regarde ce post')}&body=${encodeURIComponent(shareUrl)}`, '_self'),
    },
    {
      label: 'Threads',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path className="text-app-black dark:text-zinc-200" d="M17.14 11.24c-.1-.05-.2-.09-.3-.13-.18-3.27-1.96-5.14-4.96-5.16h-.04c-1.79 0-3.27.76-4.19 2.15l1.64 1.13c.68-1.03 1.75-1.25 2.55-1.25h.03c.99.01 1.73.29 2.22.85.35.4.59.96.71 1.66a12.3 12.3 0 0 0-2.81-.13c-2.83.16-4.65 1.81-4.53 4.1.06 1.16.64 2.16 1.64 2.81.84.55 1.93.82 3.06.76 1.49-.08 2.65-.65 3.47-1.7.62-.79 1.01-1.81 1.18-3.09.71.43 1.24.99 1.53 1.67.5 1.16.53 3.06-1.02 4.61-1.35 1.35-2.97 1.93-5.42 1.95-2.73-.02-4.8-.89-6.15-2.6-1.26-1.59-1.91-3.88-1.94-6.81.03-2.93.68-5.22 1.94-6.81C6.43 4.94 8.5 4.07 11.23 4.05c2.75.02 4.85.9 6.24 2.6.68.84 1.2 1.9 1.54 3.13l1.93-.51c-.42-1.52-1.08-2.83-1.98-3.93C17.12 3.14 14.53 2.03 11.24 2h-.01C7.95 2.03 5.42 3.14 3.76 5.32 2.24 7.31 1.46 10.1 1.42 13.71v.02c.04 3.6.82 6.4 2.34 8.39C5.42 24.3 7.95 25.4 11.23 25.44h.01c3.05-.03 5.19-.84 6.98-2.63 2.3-2.3 2.23-5.18 1.47-6.95-.54-1.26-1.57-2.28-2.98-2.97Zm-5.04 5.16c-1.24.07-2.52-.49-2.58-1.68-.05-.88.63-1.87 2.65-1.98.23-.02.46-.02.68-.02.73 0 1.42.07 2.04.21-.23 2.91-1.59 3.4-2.79 3.47Z" />
        </svg>
      ),
      onClick: () => {
        navigator.clipboard.writeText(shareUrl).catch(() => undefined);
        window.open('https://www.threads.net/', '_blank');
      },
    },
    {
      label: 'X',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-app-black dark:text-zinc-200" fill="currentColor">
          <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.3 17.41Z" />
        </svg>
      ),
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText ?? '')}&url=${encodeURIComponent(shareUrl)}`, '_blank'),
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="bg-white dark:bg-[#161b22] border border-app-border dark:border-zinc-800 rounded-[28px] w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative flex items-center justify-center px-5 py-4 border-b border-app-border/60 dark:border-zinc-800/60 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="absolute left-5 w-8 h-8 rounded-full flex items-center justify-center text-app-black dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer bg-transparent border-none"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-base font-black text-app-black dark:text-zinc-100">Partager</h3>
            </div>

            {/* Recherche */}
            <div className="px-5 pt-4 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-app-gray pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-app-border/60 dark:border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none focus:ring-1 focus:ring-[#8B4A2B]/40 transition-all"
                />
              </div>
            </div>

            {/* Amis */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 hide-scrollbar">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-app-gray py-8">
                  Aucun ami trouvé{search ? ` pour « ${search} »` : ''}.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {filtered.map((f) => {
                    const state = sentTo[f.id];
                    return (
                      <button
                        key={f.id}
                        type="button"
                        disabled={state === 'sending' || state === 'sent'}
                        onClick={() => {
                          setSentTo((prev) => ({ ...prev, [f.id]: 'sending' }));
                          shareMutation.mutate({ id: f.id, name: f.name });
                        }}
                        className="flex flex-col items-center gap-1.5 py-2 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-80 bg-transparent border-none"
                      >
                        <div className="relative">
                          <ProfileAvatar src={f.avatar} alt={f.name} size="lg" glow="none" />
                          {state === 'sent' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#161b22] flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                          {state === 'sending' && (
                            <span className="absolute inset-0 rounded-full bg-white/60 dark:bg-black/50 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin text-[#8B4A2B]" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-app-black dark:text-zinc-300 text-center leading-tight line-clamp-2 break-all max-w-full">
                          {state === 'sent' ? 'Envoyé ✓' : f.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Partage externe */}
            <div className="shrink-0 border-t border-app-border/60 dark:border-zinc-800/60 px-3 py-3.5">
              <div className="flex items-start justify-between gap-1 overflow-x-auto hide-scrollbar">
                {socials.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={s.onClick}
                    className="flex flex-col items-center gap-1.5 min-w-[58px] flex-1 px-1 py-1.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <span className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      {s.label === 'Copier le lien' && sentTo.__copied === 'sent' ? (
                        <Check className="w-6 h-6 text-emerald-500" />
                      ) : (
                        s.icon
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-app-gray dark:text-zinc-400 text-center leading-tight">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
