import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

export interface TotemAvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  level?: number;
  glow?: 'orange' | 'red' | 'blue' | 'turquoise' | 'violet' | 'none';
  hasStory?: boolean;
  onClick?: () => void;
  className?: string;
  statusDot?: 'online' | 'offline' | 'none';
  shape?: 'circle' | 'square' | 'hexagon' | 'cloud';
  countryFlag?: string;
}

const sizeValues = {
  xs: 32,
  sm: 36,
  md: 48,
  lg: 72,
  xl: 140,
};

const glowStops: Record<string, { stop1: string; stop2: string; stop3: string }> = {
  orange: { stop1: '#f97316', stop2: '#f59e0b', stop3: '#ea580c' },
  red: { stop1: '#ef4444', stop2: '#f43f5e', stop3: '#be123c' },
  blue: { stop1: '#2563eb', stop2: '#7c3aed', stop3: '#a855f7' },
  turquoise: { stop1: '#2563eb', stop2: '#7c3aed', stop3: '#a855f7' }, // Premium Blue-Violet halo glow stop
  violet: { stop1: '#4f46e5', stop2: '#8b5cf6', stop3: '#d946ef' },
  sunset: { stop1: '#ff7e5f', stop2: '#feb47b', stop3: '#ff7e5f' },
  citrus: { stop1: '#a8ff78', stop2: '#78ffd6', stop3: '#a8ff78' },
  none: { stop1: '#cbd5e1', stop2: '#e2e8f0', stop3: '#94a3b8' },
};

const hexClip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
// Smooth 8-lobed organic flower-cloud SVG path
const cloudPath = "M93.50,50.00 C93.50,54.99 81.94,57.83 80.03,62.44 C78.12,67.05 84.29,77.23 80.76,80.76 C77.23,84.29 67.05,78.12 62.44,80.03 C57.83,81.94 54.99,93.50 50.00,93.50 C45.01,93.50 42.17,81.94 37.56,80.03 C32.95,78.12 22.77,84.29 19.24,80.76 C15.71,77.23 21.88,67.05 19.97,62.44 C18.06,57.83 6.50,54.99 6.50,50.00 C6.50,45.01 18.06,42.17 19.97,37.56 C21.88,32.95 15.71,22.77 19.24,19.24 C22.77,15.71 32.95,21.88 37.56,19.97 C42.17,18.06 45.01,6.50 50.00,6.50 C54.99,6.50 57.83,18.06 62.44,19.97 C67.05,21.88 77.23,15.71 80.76,19.24 C84.29,22.77 78.12,32.95 80.03,37.56 C81.94,42.17 93.50,45.01 93.50,50.00 Z";

const nameFlagMap: Record<string, string> = {
  'amal': '🇧🇯',
  'rito': '🇳🇿',
  'safala': '🇸🇳',
  'keno': '🇪🇹',
  'dany': '🇲🇽',
  'yuki': '🇯🇵',
  'stevian': '🇫🇷',
  'jumana': '🇯🇴',
  'halean': '🇺🇸',
  'sofaia': '🇵🇪',
  'fatimah': '🇲🇦',
  'zeoo': '🇧🇷',
  'chloe': '🇺🇸',
  'sophia': '🇯🇵',
  'grace': '🇬🇧',
  'elena': '🇵🇪',
  'nala': '🇧🇯',
  'zara': '🇳🇿',
  'caleb': '🇳🇴',
  'ethan': '🇯🇵',
};

export const TotemAvatar = ({
  src,
  alt = '',
  size = 'md',
  level,
  glow = 'turquoise',
  hasStory = false,
  onClick,
  className,
  statusDot = 'none',
  shape = 'cloud',
  countryFlag,
}: TotemAvatarProps) => {
  const sizePx = sizeValues[size] || 48;
  const glowKey = hasStory ? 'orange' : (glow || 'turquoise');
  const stops = glowStops[glowKey] || glowStops['turquoise'];
  
  // Resolve country flag based on prop, or search map by alt name (user name)
  let resolvedFlag = countryFlag;
  if (!resolvedFlag && alt) {
    const firstWord = alt.trim().split(' ')[0].toLowerCase();
    resolvedFlag = nameFlagMap[firstWord];
  }

  // Unique ID for the SVG gradient reference
  const gradId = `avatar-grad-${size}-${glow}-${hasStory ? 'story' : 'std'}-${shape}`;
  const clipId = `clip-cloud-${size}-${glow}-${hasStory ? 'story' : 'std'}`;

  // Helper styles based on shape
  const isCircle = shape === 'circle';
  const isSquare = shape === 'square';
  const isHexagon = shape === 'hexagon';
  const isCloud = shape === 'cloud';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.06 : 1, y: isCloud ? -4 : 0 }}
      animate={isCloud ? { y: [0, -3, 0] } : undefined}
      transition={
        isCloud 
          ? { 
              y: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' },
              scale: { duration: 0.2 }
            } 
          : { duration: 0.3, ease: 'easeOut' }
      }
      style={{ width: sizePx, height: sizePx }}
      className={cn(
        'relative select-none shrink-0 group',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* SVG Layer: Handles Layer 1 + Layer 2 (Gradient border outline) */}
      <svg
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          filter: isCloud 
            ? 'drop-shadow(0px 6px 12px rgba(124, 58, 237, 0.3)) drop-shadow(0px 2px 4px rgba(37, 99, 235, 0.2))' 
            : 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.12))',
        }}
        className={cn(
          isCloud ? 'text-[#111111] dark:text-[#111111]' : 'text-white dark:text-zinc-900',
          'transition-colors'
        )}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={stops.stop1} />
            <stop offset="50%" stopColor={stops.stop2} />
            <stop offset="100%" stopColor={stops.stop3} />
          </linearGradient>
          {isCloud && (
            <clipPath id={clipId}>
              <path
                d={cloudPath}
                transform="translate(7.5, 7.5) scale(0.85)"
              />
            </clipPath>
          )}
        </defs>

        {isCloud ? (
          <>
            {/* Couche 1 : Support plein noir luxury (#111111) */}
            <path
              d={cloudPath}
              fill="currentColor"
            />
            {/* Couche 3 : Image clippée (rendu interne SVG pour alignement parfait) */}
            <g clipPath={`url(#${clipId})`}>
              {src ? (
                <image
                  href={src}
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <>
                  <rect x="0" y="0" width="100" height="100" fill="#27272a" />
                  <text
                    x="50"
                    y="55"
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="16"
                    fontWeight="900"
                    fontFamily="var(--font-sans)"
                  >
                    {alt ? alt.substring(0, 2).toUpperCase() : 'CM'}
                  </text>
                </>
              )}
            </g>
            {/* Couche 2 : Contour dégradé cloud */}
            <path
              d={cloudPath}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3.5"
            />
          </>
        ) : isHexagon ? (
          <>
            {/* Couche 1 : Support plein blanc pointed-top (radius = 48) */}
            <polygon
              points="50,2 92.5,26.5 92.5,73.5 50,98 7.5,73.5 7.5,26.5"
              fill="currentColor"
            />
            {/* Couche 2 : Contour dégradé pointed-top hexagone (radius = 44) */}
            <polygon
              points="50,6 89,28.5 89,71.5 50,94 11,71.5 11,28.5"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3.5"
            />
          </>
        ) : isSquare ? (
          <>
            {/* Couche 1 : Support plein blanc rounded square */}
            <rect
              x="2" y="2" width="96" height="96" rx="20"
              fill="currentColor"
            />
            {/* Couche 2 : Contour dégradé rounded square */}
            <rect
              x="6" y="6" width="88" height="88" rx="16"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3.5"
            />
          </>
        ) : (
          <>
            {/* Couche 1 : Support plein blanc cercle */}
            <circle
              cx="50" cy="50" r="48"
              fill="currentColor"
            />
            {/* Couche 2 : Contour dégradé cercle */}
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3.5"
            />
          </>
        )}
      </svg>

      {/* Couche 3 : L'avatar clippé (seulement pour les formes non-cloud) */}
      {!isCloud && (
        <div
          style={{
            position: 'absolute',
            inset: isHexagon ? '13.5%' : isSquare ? '11%' : '9%',
            overflow: 'hidden',
            clipPath: isHexagon ? hexClip : undefined,
            borderRadius: isHexagon ? undefined : isSquare ? '16%' : '50%',
          }}
          className="bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center transition-colors"
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[10px] md:text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-tight select-none">
              {alt ? alt.substring(0, 2) : 'CM'}
            </span>
          )}
        </div>
      )}

      {/* Badge de Niveau ou Drapeau */}
      {(resolvedFlag || level !== undefined) && (
        <div
          style={{
            position: 'absolute',
            bottom: isCloud ? -sizePx * 0.02 : isHexagon ? -sizePx * 0.05 : 0,
            right: isCloud ? -sizePx * 0.02 : isHexagon ? -sizePx * 0.05 : 0,
            width: sizePx * 0.36,
            height: sizePx * 0.36,
            background: resolvedFlag ? '#111111' : '#3f37c9',
            clipPath: isHexagon ? hexClip : undefined,
            borderRadius: isHexagon ? undefined : isSquare ? '25%' : '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
          }}
          className="shadow-md z-10 text-white select-none font-black leading-none"
        >
          {resolvedFlag ? (
            <span style={{ fontSize: `${Math.max(sizePx * 0.16, 11)}px`, lineHeight: 1 }}>
              {resolvedFlag}
            </span>
          ) : (
            <span style={{ fontSize: `${Math.max(sizePx * 0.09, 8.5)}px` }}>
              {level}
            </span>
          )}
        </div>
      )}

      {/* Point de statut (online / offline) */}
      {statusDot && statusDot !== 'none' && (
        <div
          style={{
            position: 'absolute',
            top: isCloud ? sizePx * 0.06 : isHexagon ? sizePx * 0.02 : sizePx * 0.04,
            left: isCloud ? sizePx * 0.06 : isHexagon ? sizePx * 0.02 : sizePx * 0.04,
            width: sizePx * 0.22,
            height: sizePx * 0.22,
            borderRadius: '50%',
            background: statusDot === 'online' ? '#3ddc84' : '#9ca3af',
          }}
          className="border border-white dark:border-zinc-950 shadow-sm z-10"
        />
      )}
    </motion.div>
  );
};

