import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  hasImage?: boolean;
  hasAvatar?: boolean;
}

export const SkeletonCard = ({ 
  className, 
  lines = 3, 
  hasImage = false,
  hasAvatar = false 
}: SkeletonCardProps) => {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 space-y-4', className)}>
      {hasImage && (
        <div className="w-full h-40 bg-muted rounded-lg animate-pulse" />
      )}
      
      <div className="flex items-start gap-3">
        {hasAvatar && (
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
        )}
        
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-muted rounded animate-pulse"
              style={{ 
                width: i === 0 ? '70%' : i === lines - 1 ? '40%' : '90%',
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonList = ({ count = 3, ...props }: { count?: number } & SkeletonCardProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} {...props} />
      ))}
    </div>
  );
};

export const SkeletonGrid = ({ count = 6, ...props }: { count?: number } & SkeletonCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} hasImage {...props} />
      ))}
    </div>
  );
};
