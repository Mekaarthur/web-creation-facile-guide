import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
  showWarning?: boolean;
}

export const CharacterCounter = ({
  current,
  max,
  className,
  showWarning = true,
}: CharacterCounterProps) => {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const isError = percentage >= 100;

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span
        className={cn(
          'tabular-nums transition-colors',
          isError && 'text-destructive font-medium',
          isWarning && showWarning && 'text-yellow-600',
          !isWarning && !isError && 'text-muted-foreground'
        )}
      >
        {current}/{max}
      </span>
      
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            isError && 'bg-destructive',
            isWarning && 'bg-yellow-500',
            !isWarning && !isError && 'bg-primary'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
