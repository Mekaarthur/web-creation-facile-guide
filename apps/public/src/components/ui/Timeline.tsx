import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TimelineItem {
  title: string;
  description?: string;
  date?: string;
  icon?: ReactNode;
  status?: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline = ({ items, className }: TimelineProps) => {
  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const status = item.status || 'upcoming';

        return (
          <div key={index} className="flex gap-4">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background z-10',
                  status === 'completed' && 'border-primary bg-primary text-primary-foreground',
                  status === 'current' && 'border-primary bg-primary/10',
                  status === 'upcoming' && 'border-muted-foreground/30'
                )}
              >
                {item.icon || (
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      status === 'completed' && 'bg-primary-foreground',
                      status === 'current' && 'bg-primary',
                      status === 'upcoming' && 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </div>
              
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[40px]',
                    status === 'completed' ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-8', isLast && 'pb-0')}>
              {item.date && (
                <span className="text-xs text-muted-foreground">
                  {item.date}
                </span>
              )}
              <h4
                className={cn(
                  'font-medium',
                  status === 'current' && 'text-primary',
                  status === 'upcoming' && 'text-muted-foreground'
                )}
              >
                {item.title}
              </h4>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
