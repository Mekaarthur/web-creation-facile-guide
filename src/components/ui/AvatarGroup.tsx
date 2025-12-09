import { cn } from '@/lib/utils';

interface AvatarData {
  src?: string;
  name: string;
}

interface AvatarGroupProps {
  avatars: AvatarData[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const colors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export const AvatarGroup = ({
  avatars,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) => {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            'rounded-full border-2 border-background flex items-center justify-center font-medium text-white',
            sizes[size],
            !avatar.src && colors[index % colors.length]
          )}
          title={avatar.name}
        >
          {avatar.src ? (
            <img
              src={avatar.src}
              alt={avatar.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(avatar.name)
          )}
        </div>
      ))}
      
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full border-2 border-background bg-muted flex items-center justify-center font-medium text-muted-foreground',
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
