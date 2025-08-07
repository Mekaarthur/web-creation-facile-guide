import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}

export const LoadingSkeleton = ({ 
  className, 
  lines = 3, 
  showAvatar = false, 
  showActions = false,
  ...props
}: LoadingSkeletonProps) => {
  return (
    <Card className={cn("animate-pulse-soft", className)} {...props}>
      <CardHeader className="space-y-2">
        <div className="flex items-center space-x-3">
          {showAvatar && (
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
          )}
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-3 bg-muted rounded animate-pulse",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          ></div>
        ))}
        {showActions && (
          <div className="flex gap-2 pt-4">
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const GridLoadingSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton 
          key={i} 
          lines={3} 
          showAvatar 
          showActions
        />
      ))}
    </div>
  );
};

export const ListLoadingSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton 
          key={i} 
          lines={2} 
          showAvatar 
          showActions
          className="border-l-4 border-l-primary/20"
        />
      ))}
    </div>
  );
};