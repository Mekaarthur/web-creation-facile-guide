import { cn } from '@/lib/utils';

type StatusType = 'online' | 'offline' | 'busy' | 'away';

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
  showLabel?: boolean;
  pulse?: boolean;
}

const statusConfig: Record<StatusType, { color: string; label: string }> = {
  online: { color: 'bg-green-500', label: 'En ligne' },
  offline: { color: 'bg-gray-400', label: 'Hors ligne' },
  busy: { color: 'bg-red-500', label: 'Occupé' },
  away: { color: 'bg-yellow-500', label: 'Absent' },
};

export const StatusIndicator = ({
  status,
  className,
  showLabel = false,
  pulse = true,
}: StatusIndicatorProps) => {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex h-3 w-3">
        {pulse && status === 'online' && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              config.color
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-3 w-3',
            config.color
          )}
        />
      </span>
      
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {config.label}
        </span>
      )}
    </div>
  );
};
