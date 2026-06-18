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
}

const sizeValues = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 72,
  xl: 120,
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

const hexClip = "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)";

export const TotemAvatar = ({
  src,
  alt = '',
  size = 'md',
  level,
  glow = 'turquoise',
  hasStory = false,
  onClick,
  className,
}: TotemAvatarProps) => {
  const sizePx = sizeValues[size] || 48;
  const glowKey = hasStory ? 'orange' : (glow || 'turquoise');
  const stops = glowStops[glowKey] || glowStops['turquoise'];
  
  // Unique ID for the SVG gradient reference
  const gradId = `hex-grad-${size}-${glow}-${hasStory ? 'story' : 'std'}`;

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
      {/* SVG Layer: Handles Layer 1 (White/Dark main background underlay) + Layer 2 (Colorful dynamic gradient stroke) */}
      <svg
        viewBox="0 0 160 160"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))',
        }}
        className="text-white dark:text-zinc-950 transition-colors"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={stops.stop1} />
            <stop offset="50%" stopColor={stops.stop2} />
            <stop offset="100%" stopColor={stops.stop3} />
          </linearGradient>
        </defs>

        {/* Couche 1 : Support plein (blanc en light mode, zinc-950 en dark mode) */}
        <polygon
          points="40,5 120,5 158,80 120,155 40,155 2,80"
          fill="currentColor"
        />

        {/* Couche 2 : Contour dégradé, transparent à l'intérieur */}
        <polygon
          points="33,12 127,12 154,80 127,148 33,148 9,80"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="6.5"
        />
      </svg>

      {/* Couche 3 : L'avatar ou initiales, clippé en hexagone, centré précisément */}
      <div
        style={{
          position: 'absolute',
          inset: '9.5%',
          overflow: 'hidden',
          clipPath: hexClip,
        }}
        className="bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center transition-colors"
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

      {/* Badge de Niveau : Hexagone plein indépendant en bas à droite */}
      {level !== undefined && (
        <div
          style={{
            position: 'absolute',
            bottom: -sizePx * 0.04,
            right: -sizePx * 0.12,
            width: sizePx * 0.32,
            height: sizePx * 0.28,
            background: '#4338ca',
            clipPath: hexClip,
          }}
          className="flex items-center justify-center text-white font-black leading-none shadow-sm z-10"
        >
          <span style={{ fontSize: `${Math.max(sizePx * 0.11, 8.5)}px` }}>
            {level}
          </span>
        </div>
      )}
    </motion.div>
  );
};

