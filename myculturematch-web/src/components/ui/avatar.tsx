import { TotemAvatar } from './TotemAvatar';

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
  return (
    <TotemAvatar
      src={src}
      alt={alt || fallback}
      size={size}
      className={className}
      shape="cloud"
      glow="none"
    />
  );
};

