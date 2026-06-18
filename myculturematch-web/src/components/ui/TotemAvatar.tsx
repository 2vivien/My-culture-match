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
  shape?: 'circle' | 'square' | 'hexagon';
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
  blue: { stop1: '#3b82f6', stop2: '#4f8ffe', stop3: '#4338ca' },
  turquoise: { stop1: '#2dd9d9', stop2: '#4f8ffe', stop3: '#6c63fc' }, // Cyan -> Blue -> Violet
  violet: { stop1: '#a855f7', stop2: '#7c3aed', stop3: '#4c1d95' },
  sunset: { stop1: '#ff7e5f', stop2: '#feb47b', stop3: '#ff7e5f' },
  citrus: { stop1: '#a8ff78', stop2: '#78ffd6', stop3: '#a8ff78' },
  none: { stop1: '#cbd5e1', stop2: '#e2e8f0', stop3: '#94a3b8' },
};

const hexClip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

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
  shape = 'circle',
}: TotemAvatarProps) => {
  const sizePx = sizeValues[size] || 48;
  const glowKey = hasStory ? 'orange' : (glow || 'turquoise');
  const stops = glowStops[glowKey] || glowStops['turquoise'];
  
  // Unique ID for the SVG gradient reference
  const gradId = `avatar-grad-${size}-${glow}-${hasStory ? 'story' : 'std'}-${shape}`;

  // Helper styles based on shape
  const isCircle = shape === 'circle';
  const isSquare = shape === 'square';
  const isHexagon = shape === 'hexagon';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.05 : 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ width: sizePx, height: sizePx }}
      className={cn(
        'relative select-none shrink-0 group',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* SVG Layer: Handles Layer 1 (White background underlay) + Layer 2 (Colorful dynamic gradient stroke) */}
      <svg
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.12))',
        }}
        className="text-white dark:text-zinc-900 transition-colors"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={stops.stop1} />
            <stop offset="50%" stopColor={stops.stop2} />
            <stop offset="100%" stopColor={stops.stop3} />
          </linearGradient>
        </defs>

        {isHexagon ? (
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

      {/* Couche 3 : L'avatar clippé */}
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

      {/* Badge de Niveau */}
      {level !== undefined && (
        <div
          style={{
            position: 'absolute',
            bottom: isHexagon ? -sizePx * 0.05 : 0,
            right: isHexagon ? -sizePx * 0.05 : 0,
            width: sizePx * 0.32,
            height: sizePx * 0.32,
            background: '#3f37c9',
            clipPath: isHexagon ? hexClip : undefined,
            borderRadius: isHexagon ? undefined : isSquare ? '25%' : '50%',
          }}
          className="flex items-center justify-center text-white font-black leading-none shadow-md z-10"
        >
          <span style={{ fontSize: `${Math.max(sizePx * 0.09, 8.5)}px` }}>
            {level}
          </span>
        </div>
      )}

      {/* Point de statut (online / offline) */}
      {statusDot && statusDot !== 'none' && (
        <div
          style={{
            position: 'absolute',
            top: isHexagon ? sizePx * 0.02 : sizePx * 0.04,
            left: isHexagon ? sizePx * 0.02 : sizePx * 0.04,
            width: sizePx * 0.22,
            height: sizePx * 0.22,
            borderRadius: '50%',
            background: statusDot === 'online' ? '#3ddc84' : '#ff4757',
          }}
          className="border border-white dark:border-zinc-950 shadow-sm z-10"
        />
      )}
    </motion.div>
  );
};

