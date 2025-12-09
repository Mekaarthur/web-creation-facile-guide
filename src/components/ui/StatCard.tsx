import { ReactNode, useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  icon?: ReactNode;
  className?: string;
  animate?: boolean;
}

export const StatCard = ({
  title,
  value,
  previousValue,
  prefix = '',
  suffix = '',
  icon,
  className,
  animate = true,
}: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Calculate trend
  const trend = previousValue !== undefined
    ? ((value - previousValue) / previousValue) * 100
    : null;

  const trendDirection = trend === null ? null : trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';

  // Animate on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate value
  useEffect(() => {
    if (!animate || !isVisible) return;

    const duration = 1000;
    const startTime = Date.now();
    const startValue = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(startValue + (value - startValue) * eased);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [value, animate, isVisible]);

  return (
    <div
      ref={ref}
      className={cn(
        'p-6 rounded-xl border bg-card transition-all hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tabular-nums">
            {prefix}
            {displayValue.toLocaleString('fr-FR', {
              maximumFractionDigits: value % 1 === 0 ? 0 : 1,
            })}
            {suffix}
          </p>
          
          {trend !== null && (
            <div className="flex items-center gap-1">
              {trendDirection === 'up' && (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              {trendDirection === 'down' && (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              {trendDirection === 'neutral' && (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trendDirection === 'up' && 'text-green-500',
                  trendDirection === 'down' && 'text-red-500',
                  trendDirection === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
