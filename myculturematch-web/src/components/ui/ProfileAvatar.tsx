import { cn } from '@/src/lib/utils';
import { fallbackAvatar } from '@/src/lib/media';

export interface ProfileAvatarProps {
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
  sunset: { stop1: '#8B4A2B', stop2: '#C08A62', stop3: '#8B4A2B' },
  citrus: { stop1: '#a8ff78', stop2: '#78ffd6', stop3: '#a8ff78' },
  none: { stop1: '#cbd5e1', stop2: '#e2e8f0', stop3: '#94a3b8' },
};

const hexClip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const createLacePath = (centerX = 50, centerY = 50, baseRadius = 45.5, amplitude = 1.6, lobes = 14) => {
  let path = "";
  const steps = lobes * 8;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    const r = baseRadius + amplitude * Math.cos(lobes * theta);
    const x = centerX + r * Math.cos(theta);
    const y = centerY + r * Math.sin(theta);
    if (i === 0) {
      path += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    } else {
      path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  }
  path += " Z";
  return path;
};

const cloudPath = createLacePath();

// Drapeaux résolus depuis le nom du pays d'origine (jamais depuis le prénom).
const countryFlagMap: Record<string, string> = {
  benin: '🇧🇯', 'new zealand': '🇳🇿', senegal: '🇸🇳', ethiopia: '🇪🇹',
  mexico: '🇲🇽', japan: '🇯🇵', france: '🇫🇷', jordan: '🇯🇴',
  morocco: '🇲🇦', brazil: '🇧🇷', usa: '🇺🇸', uk: '🇬🇧',
  canada: '🇨🇦', australia: '🇦🇺', germany: '🇩🇪', spain: '🇪🇸',
  italy: '🇮🇹', 'south korea': '🇰🇷', china: '🇨🇳', india: '🇮🇳',
  egypt: '🇪🇬', ghana: '🇬🇭', nigeria: '🇳🇬', kenya: '🇰🇪',
  peru: '🇵🇪', colombia: '🇨🇴', argentina: '🇦🇷',
  togo: '🇹🇬', 'côte d’ivoire': '🇨🇮', 'côte d ivoire': '🇨🇮', "côte d'ivoire": '🇨🇮', 'ivory coast': '🇨🇮', cameroon: '🇨🇲',
  mali: '🇲🇱', 'burkina faso': '🇧🇫', guinea: '🇬🇳', niger: '🇳🇪',
  'united states': '🇺🇸', 'united kingdom': '🇬🇧', 'united states of america': '🇺🇸',
  // Afrique de l'Ouest & Centrale
  gabon: '🇬🇦', congo: '🇨🇬', 'democratic republic of the congo': '🇨🇩', 'rd congo': '🇨🇩', drc: '🇨🇩',
  chad: '🇹🇩', 'central african republic': '🇨🇫', 'equatorial guinea': '🇬🇶',
  'sierra leone': '🇸🇱', liberia: '🇱🇷', gambia: '🇬🇲', 'guinea-bissau': '🇬🇼', 'cape verde': '🇨🇻',
  // Afrique de l'Est & australe
  uganda: '🇺🇬', rwanda: '🇷🇼', burundi: '🇧🇮', 'south africa': '🇿🇦', zambia: '🇿🇲',
  zimbabwe: '🇿🇼', mozambique: '🇲🇿', angola: '🇦🇴', botswana: '🇧🇼', namibia: '🇳🇦',
  madagascar: '🇲🇬', tanzania: '🇹🇿', somalia: '🇸🇴', sudan: '🇸🇩', 'south sudan': '🇸🇸', eritrea: '🇪🇷', djibouti: '🇩🇯',
  // Maghreb & Moyen-Orient
  algeria: '🇩🇿', tunisia: '🇹🇳', libya: '🇱🇾', mauritania: '🇲🇷',
  'saudi arabia': '🇸🇦', 'united arab emirates': '🇦🇪', qatar: '🇶🇦', kuwait: '🇰🇼', lebanon: '🇱🇧', syria: '🇸🇾', iraq: '🇮🇶', turkey: '🇹🇷', israel: '🇮🇱', palestine: '🇵🇸', iran: '🇮🇷',
  // Europe
  portugal: '🇵🇹', netherlands: '🇳🇱', belgium: '🇧🇪', switzerland: '🇨🇭', austria: '🇦🇹',
  poland: '🇵🇱', romania: '🇷🇴', greece: '🇬🇷', sweden: '🇸🇪', norway: '🇳🇴', denmark: '🇩🇰', finland: '🇫🇮', ireland: '🇮🇪', russia: '🇷🇺', ukraine: '🇺🇦',
  // Amériques
  'united states of america (usa)': '🇺🇸', haiti: '🇭🇹', jamaica: '🇯🇲', 'trinidad and tobago': '🇹🇹',
  'dominican republic': '🇩🇴', cuba: '🇨🇺', 'costa rica': '🇨🇷', panama: '🇵🇦', guatemala: '🇬🇹',
  ecuador: '🇪🇨', bolivia: '🇧🇴', venezuela: '🇻🇪', paraguay: '🇵🇾', uruguay: '🇺🇾', chile: '🇨🇱',
  // Asie & Océanie
  pakistan: '🇵🇰', bangladesh: '🇧🇩', 'sri lanka': '🇱🇰', nepal: '🇳🇵', afghanistan: '🇦🇫',
  thailand: '🇹🇭', vietnam: '🇻🇳', philippines: '🇵🇭', indonesia: '🇮🇩', malaysia: '🇲🇾', singapore: '🇸🇬',
  'hong kong': '🇭🇰', taiwan: '🇹🇼', mongolia: '🇲🇳', cambodia: '🇰🇭', laos: '🇱🇦', myanmar: '🇲🇲',
  'north korea': '🇰🇵', 'new caledonia': '🇳🇨', fiji: '🇫🇯', 'papua new guinea': '🇵🇬',
};

/** Résout le drapeau à partir du pays d'origine (nom du pays). */
export function resolveCountryFlag(country?: string | null): string | undefined {
  if (!country) return undefined;
  return countryFlagMap[country.trim().toLowerCase()];
}

export const ProfileAvatar = ({
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
}: ProfileAvatarProps) => {
  const sizePx = sizeValues[size] || 48;
  const glowKey = hasStory ? 'orange' : (glow || 'turquoise');
  const stops = glowStops[glowKey] || glowStops['turquoise'];
  
  // Le drapeau vient du pays d'origine passé explicitement (prop countryFlag)
  const resolvedFlag = countryFlag;

  // Photo réelle si fournie, sinon avatar généré (jamais d'initiales type "vi").
  const resolvedSrc = src || fallbackAvatar(alt);

  // Unique ID for the SVG gradient reference
  const gradId = `avatar-grad-${size}-${glow}-${hasStory ? 'story' : 'std'}-${shape}`;
  const clipId = `clip-cloud-${size}-${glow}-${hasStory ? 'story' : 'std'}`;

  // Helper styles based on shape
  const isCircle = shape === 'circle';
  const isSquare = shape === 'square';
  const isHexagon = shape === 'hexagon';
  const isCloud = shape === 'cloud';

  const glowColors: Record<string, string> = {
    orange: '#e27d60',
    red: '#ef4444',
    blue: '#2563eb',
    turquoise: '#06b6d4',
    violet: '#8b5cf6',
    sunset: '#8B4A2B',
    citrus: '#a8ff78',
    none: '#cbd5e1',
  };
  const bgHex = glowColors[glowKey] || '#cbd5e1';

  return (
    <div
      onClick={onClick}
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
          filter: isCloud && glowKey !== 'none'
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
                transform="translate(0, 0) scale(1)"
              />
            </clipPath>
          )}
        </defs>

        {isCloud ? (
          <>
            {/* Couche 1 : Support plein coloré (glow) */}
            <path
              d={cloudPath}
              fill={bgHex}
            />
            {/* Couche 3 : Image clippée (rendu interne SVG pour alignement parfait) */}
            <g clipPath={`url(#${clipId})`}>
              {resolvedSrc ? (
                <image
                  href={resolvedSrc}
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : null}
            </g>
          </>
        ) : isHexagon ? (
          <>
            {/* Couche 1 : Support plein blanc pointed-top (radius = 48) */}
            <polygon
              points="50,2 92.5,26.5 92.5,73.5 50,98 7.5,73.5 7.5,26.5"
              fill="currentColor"
            />
            {/* Couche 2 : Contour dégradé pointed-top hexagone (radius = 44) */}
            {glowKey !== 'none' && (
              <polygon
                points="50,6 89,28.5 89,71.5 50,94 11,71.5 11,28.5"
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth="3.5"
              />
            )}
          </>
        ) : isSquare ? (
          <>
            {/* Couche 1 : Support plein blanc rounded square */}
            <rect
              x="2" y="2" width="96" height="96" rx="20"
              fill="currentColor"
            />
            {/* Couche 2 : Contour dégradé rounded square */}
            {glowKey !== 'none' && (
              <rect
                x="6" y="6" width="88" height="88" rx="16"
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth="3.5"
              />
            )}
          </>
        ) : (
          <>
            {/* Couche 1 : Support plein blanc cercle */}
            <circle
              cx="50" cy="50" r="48"
              fill="currentColor"
            />
            {/* Couche 2 : Contour dégradé cercle */}
            {glowKey !== 'none' && (
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth="3.5"
              />
            )}
          </>
        )}
      </svg>

      {/* Couche 3 : L'avatar clippé (seulement pour les formes non-cloud) */}
      {!isCloud && (
        <div
          style={{
            position: 'absolute',
            inset: glowKey === 'none' ? '0%' : (isHexagon ? '13.5%' : isSquare ? '11%' : '9%'),
            overflow: 'hidden',
            clipPath: isHexagon ? hexClip : undefined,
            borderRadius: isHexagon ? undefined : isSquare ? '16%' : '50%',
          }}
          className="bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center transition-colors"
        >
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={alt}
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
          ) : null}
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
    </div>
  );
};
