import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}

const sizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variants = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-destructive',
};

export const AnimatedProgress = ({
  value,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  variant = 'default',
  animated = true,
}: AnimatedProgressProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progression</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            variants[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  );
};
