import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export const SuccessAnimation = ({
  show,
  message = "Succès !",
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className={cn(
        "flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/95 backdrop-blur-sm border border-border shadow-2xl",
        "animate-scale-in"
      )}>
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-primary animate-[scale-in_0.3s_ease-out_0.2s_both]" />
          </div>
          <svg className="absolute inset-0 w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="188.5"
              strokeDashoffset="188.5"
              className="animate-[draw-circle_0.5s_ease-out_forwards]"
            />
          </svg>
        </div>
        <span className="text-sm font-medium text-foreground animate-fade-in">
          {message}
        </span>
      </div>
      
      <style>{`
        @keyframes draw-circle {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};
