import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Loader2, Send, Wand2 } from 'lucide-react';
import { IconRobot } from '@tabler/icons-react';
import { getSuggestions } from '@/src/services/aiAssistService';
import type { Conversation } from '@/src/types/chat.types';

interface AssistantPanelProps {
  partner: Conversation;
  lastMessage?: string;
  onPick: (text: string) => void;
  /** Contrôle externe : popup ouvert (depuis la puce robot sur un message reçu, ou le bouton). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lyra — assistante de conversation culturelle.
 * S'ouvre à côté du message de l'interlocuteur (icône robot au hover) ou via le
 * bouton robot de la barre de saisie : propose des réponses prêtes à envoyer,
 * et permet de demander un message sur un sujet précis (popup interne — on ne
 * quitte jamais le chat). Icône unique : IconRobot (zéro sparkle).
 */
export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  partner,
  lastMessage,
  onPick,
  open,
  onOpenChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [askText, setAskText] = useState('');
  const [askLoading, setAskLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getSuggestions(partner, lastMessage);
      setSuggestions(result);
      setLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (next: boolean) => {
    onOpenChange(next);
    if (next && !loadedOnce) await load();
  };

  const handleAsk = async () => {
    const subject = askText.trim();
    if (!subject) return;
    setAskLoading(true);
    try {
      const [result] = await getSuggestions(
        partner,
        `${lastMessage ? `Dernier message : "${lastMessage}". ` : ''}Sujet demandé : ${subject}`,
      );
      onPick(result);
      setShowAsk(false);
      setAskText('');
      onOpenChange(false);
    } finally {
      setAskLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Bouton d'ouverture manuelle (robot) */}
      <button
        type="button"
        onClick={() => handleOpen(!open)}
        title="Propositions de messages"
        className={open
          ? 'w-9 h-9 rounded-full border border-[#E27D60]/50 bg-[#E27D60]/10 flex items-center justify-center text-[#E27D60] hover:scale-105 transition-all cursor-pointer shrink-0'
          : 'w-9 h-9 rounded-full border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-app-gray hover:text-[#E27D60] hover:scale-105 transition-all cursor-pointer shrink-0'}
      >
        <IconRobot size={18} />
      </button>

      {/* Panneau de suggestions — ancré en bas à droite, au-dessus de la barre de saisie */}
      <AnimatePresence>
        {open && !showAsk && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#161b22] border border-app-border dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header — robot, pas de sparkle */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-app-border/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#E27D60]/10 flex items-center justify-center shrink-0">
                  <IconRobot size={18} className="text-[#E27D60]" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-black text-app-black dark:text-zinc-100">Lyra</p>
                  <p className="text-[11px] text-app-gray dark:text-zinc-500">Propositions de messages</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  title="Nouvelles suggestions"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpen(false)}
                  title="Fermer"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="p-3 flex flex-col gap-2 max-h-[300px] overflow-y-auto hide-scrollbar">
              {loading && suggestions.length === 0 ? (
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-sm text-app-gray text-center py-6">
                  Aucune suggestion pour l'instant.
                </p>
              ) : (
                suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { onPick(s); handleOpen(false); }}
                    className="group text-left px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-app-border/60 dark:border-zinc-800 hover:border-[#E27D60]/50 hover:bg-[#E27D60]/5 transition-all cursor-pointer flex items-start gap-2"
                  >
                    <span className="text-sm text-app-black dark:text-zinc-200 leading-relaxed flex-1">{s}</span>
                    <Send className="w-4 h-4 mt-0.5 text-app-gray group-hover:text-[#E27D60] opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* Footer : demander un message sur un sujet précis */}
            <div className="px-3 pb-3 pt-2.5 border-t border-app-border/60 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowAsk(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#E27D60]/5 border border-[#E27D60]/20 text-[#E27D60] text-sm font-bold hover:bg-[#E27D60]/10 transition-all cursor-pointer"
              >
                <Wand2 className="w-4 h-4" />
                Demander un message sur un sujet précis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup de demande personnalisée (remplace le panneau, on reste dans le chat) */}
      <AnimatePresence>
        {open && showAsk && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 z-[60] w-[340px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#161b22] border border-app-border dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-app-border/60 dark:border-zinc-800/60">
              <p className="text-sm font-black text-app-black dark:text-zinc-100 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#E27D60]" />
                Votre demande
              </p>
              <button
                type="button"
                onClick={() => setShowAsk(false)}
                title="Retour aux suggestions"
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-sm text-app-gray dark:text-zinc-400 leading-relaxed">
                Dites à Lyra ce que vous aimeriez dire à {partner.name.split(' ')[0]} — elle rédigera le message et l'enverra.
              </p>
              <textarea
                value={askText}
                onChange={(e) => setAskText(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Ex : propose-lui de découvrir la cuisine de sa culture ce week-end"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-app-border/60 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none focus:ring-1 focus:ring-[#E27D60]/40 resize-none"
              />
              <button
                type="button"
                onClick={handleAsk}
                disabled={!askText.trim() || askLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#E27D60] hover:bg-[#c66b50] text-white text-sm font-black hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {askLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {askLoading ? 'Lyra rédige...' : 'Générer et envoyer'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
