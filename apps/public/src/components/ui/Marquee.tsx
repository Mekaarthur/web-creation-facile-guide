import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: ReactNode;
  speed?: 'slow' | 'normal' | 'fast';
  pauseOnHover?: boolean;
  direction?: 'left' | 'right';
  className?: string;
}

const speeds = {
  slow: '40s',
  normal: '25s',
  fast: '15s',
};

export const Marquee = ({
  children,
  speed = 'normal',
  pauseOnHover = true,
  direction = 'left',
  className,
}: MarqueeProps) => {
  return (
    <div
      className={cn(
        'overflow-hidden relative',
        pauseOnHover && '[&:hover_.marquee-content]:pause',
        className
      )}
    >
      <div
        className="marquee-content flex gap-8 whitespace-nowrap"
        style={{
          animation: `marquee ${speeds[speed]} linear infinite`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {children}
        {/* Duplicate for seamless loop */}
        {children}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .pause {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
};
