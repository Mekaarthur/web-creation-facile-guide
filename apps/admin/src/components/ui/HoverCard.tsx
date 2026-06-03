import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'glow' | 'border' | 'scale';
}

const effects = {
  lift: 'hover:-translate-y-1 hover:shadow-xl',
  glow: 'hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]',
  border: 'hover:border-primary',
  scale: 'hover:scale-[1.02]',
};

export const HoverCard = ({
  children,
  className,
  hoverEffect = 'lift',
}: HoverCardProps) => {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 transition-all duration-300 cursor-pointer',
        effects[hoverEffect],
        className
      )}
    >
      {children}
    </div>
  );
};
