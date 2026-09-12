import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Clock } from 'lucide-react';

/**
 * Boîte complète d'emojis : 9 catégories, recherche instantanée, emojis
 * récents (persistés en localStorage). Léger, sans dépendance, design clair
 * cohérent avec l'app (blanc, arrondis 3xl, accent #E27D60).
 */
const CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Récents',
    emojis: [],
  },
  {
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '💩', '🤡', '👻', '👽', '🤖'],
  },
  {
    label: 'Gestes',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🧠', '👀', '👁️', '👅', '👄'],
  },
  {
    label: 'Cœurs',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '💭', '🔥', '✨', '⭐', '🌟', '🎉', '🎊'],
  },
  {
    label: 'Culture',
    emojis: ['🌍', '🌎', '🌏', '🗺️', '🧭', '🏛️', '⛩️', '🕌', '🛕', '⛪', '🕍', '📜', '📖', '🎭', '🎨', '🎵', '🎶', '🥁', '🎸', '🪕', '🎺', '🎻', '🪘', '🎤', '🍲', '🍛', '🥘', '🍶', '🍵', '☕', '🫖', '🥂', '🍷', '🎎', '🎏', '🎐', '🧧', '🏮', '🪔', '🕯️', '🛐', '🪷', '📿', '🧿'],
  },
  {
    label: 'Animaux & Nature',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦛', '🐪', '🦒', '🦘', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🌿', '☘️', '🍀', '🍁', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '⭐', '✨', '⚡', '🔥', '🌈', '☀️', '⛅', '☁️', '🌧️', '⛈️', '❄️', '🌊'],
  },
  {
    label: 'Nourriture',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉'],
  },
  {
    label: 'Activités',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🚴', '🚵', '🧗', '🏇', '🏊', '🏄', '🚣', '🧘', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
  },
  {
    label: 'Voyage',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🪝', '⛽', '🚧', '🚦', '🚥', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏥', '🏦', '🏨', '🏫', '🛕'],
  },
];

const RECENTS_KEY = 'mcm-recent-emojis';
const MAX_RECENTS = 16;

/** Noms français pour la recherche instantanée (mots-clés par emoji). */
const KEYWORDS: Record<string, string> = {
  '😀': 'sourire joie', '😂': 'rire larme', '🥰': 'amour coeur', '😍': 'amour yeux',
  '🤔': 'réfléchir hmm', '😎': 'cool lunettes', '😢': 'pleure triste', '😭': 'pleure fort',
  '😡': 'colère rouge', '🔥': 'feu hot', '❤️': 'coeur love', '✨': 'étoile magie',
  '🙏': 'merci prière', '👍': 'pouce top ok', '👏': 'applaudit bravo', '🎉': 'fête party',
  '🌍': 'monde terre afrique', '🍲': 'plat cuisine sauce', '🎭': 'théâtre culture',
  '🥁': 'tambour percussions', '📜': 'histoire manuscrit', '🎵': 'musique note',
};

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function pushRecent(emoji: string): void {
  try {
    const next = [emoji, ...loadRecents().filter((e) => e !== emoji)].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // localStorage indisponible : on ignore silencieusement
  }
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeCat, setActiveCat] = useState(1); // Smileys par défaut (0 = Récents)
  const [search, setSearch] = useState('');
  const [recents, setRecents] = useState<string[]>(() => loadRecents());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const all = CATEGORIES.slice(1).flatMap((c) => c.emojis);
    const unique = Array.from(new Set(all));
    return unique.filter((e) => {
      const keywords = KEYWORDS[e] ?? '';
      return e.includes(q) || keywords.includes(q);
    });
  }, [search]);

  const handleSelect = (emoji: string) => {
    pushRecent(emoji);
    setRecents(loadRecents());
    onSelect(emoji);
  };

  const cat = CATEGORIES[activeCat];
  const showRecents = !searchResults && cat.label === 'Récents';

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full mb-2 left-0 z-50 w-[320px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#161b22] border border-app-border dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Recherche */}
        <div className="relative px-2.5 pt-2.5 pb-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-gray pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un emoji..."
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-app-border/60 dark:border-zinc-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none focus:ring-1 focus:ring-[#E27D60]/40 transition-all"
          />
        </div>

        {/* Catégories */}
        {!searchResults && (
          <div className="flex items-center gap-0.5 px-2.5 pt-1 pb-1.5 overflow-x-auto hide-scrollbar border-b border-app-border/60 dark:border-zinc-800/60">
            {CATEGORIES.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => { setActiveCat(i); setSearch(''); }}
                title={c.label}
                className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-base transition-colors cursor-pointer ${
                  i === activeCat && !search ? 'bg-[#E27D60]/15' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {c.label === 'Récents' ? <Clock className="w-4 h-4 text-app-gray" /> : c.emojis[0]}
              </button>
            ))}
          </div>
        )}

        {/* Grille d'emojis */}
        <div className="h-52 overflow-y-auto p-2.5 hide-scrollbar">
          {searchResults ? (
            searchResults.length === 0 ? (
              <p className="text-center text-xs text-app-gray py-10">
                Aucun emoji trouvé pour « {search} »
              </p>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">
                {searchResults.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )
          ) : showRecents ? (
            recents.length === 0 ? (
              <p className="text-center text-xs text-app-gray py-10 leading-relaxed">
                Vos emojis récents apparaîtront ici.<br />Utilisez d'abord une catégorie 😉
              </p>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">
                {recents.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-8 gap-0.5">
              {cat.emojis.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
