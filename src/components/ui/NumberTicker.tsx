import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const NumberTicker = ({
  value,
  duration = 1000,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
}: NumberTickerProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const current = startRef.current + (value - startRef.current) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {displayValue.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
