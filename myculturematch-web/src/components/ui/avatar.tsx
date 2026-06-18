import { cn } from '@/src/lib/utils';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar = ({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
}: AvatarProps) => {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  return (
    <div
      className={cn(
        'relative rounded-full shrink-0 flex items-center justify-center overflow-hidden bg-[#FCFCFC] border border-app-border select-none',
        sizeClass,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-xs font-semibold text-app-gray uppercase">
          {fallback || alt.substring(0, 2)}
        </span>
      )}
    </div>
  );
};
