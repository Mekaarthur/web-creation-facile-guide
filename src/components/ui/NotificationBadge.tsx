import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count?: number;
  show?: boolean;
  max?: number;
  children: ReactNode;
  className?: string;
  dotOnly?: boolean;
}

export const NotificationBadge = ({
  count = 0,
  show = true,
  max = 99,
  children,
  className,
  dotOnly = false,
}: NotificationBadgeProps) => {
  const displayCount = count > max ? `${max}+` : count;
  const shouldShow = show && (dotOnly || count > 0);

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      
      {shouldShow && (
        <span
          className={cn(
            'absolute flex items-center justify-center bg-destructive text-destructive-foreground font-medium animate-scale-in',
            dotOnly
              ? 'w-2.5 h-2.5 -top-0.5 -right-0.5 rounded-full'
              : 'min-w-[18px] h-[18px] -top-1.5 -right-1.5 rounded-full text-[10px] px-1'
          )}
        >
          {!dotOnly && displayCount}
        </span>
      )}
    </div>
  );
};
