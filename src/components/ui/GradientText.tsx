import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  gradient?: 'primary' | 'rainbow' | 'sunset' | 'ocean' | 'custom';
  customGradient?: string;
  animate?: boolean;
}

const gradients = {
  primary: 'from-primary to-primary/60',
  rainbow: 'from-red-500 via-yellow-500 to-green-500',
  sunset: 'from-orange-500 via-pink-500 to-purple-500',
  ocean: 'from-cyan-500 via-blue-500 to-indigo-500',
  custom: '',
};

export const GradientText = ({
  children,
  className,
  gradient = 'primary',
  customGradient,
  animate = false,
}: GradientTextProps) => {
  return (
    <span
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        gradient !== 'custom' && gradients[gradient],
        animate && 'animate-gradient bg-[length:200%_auto]',
        className
      )}
      style={customGradient ? { backgroundImage: customGradient } : undefined}
    >
      {children}
      
      {animate && (
        <style>{`
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            animation: gradient 3s ease infinite;
          }
        `}</style>
      )}
    </span>
  );
};
