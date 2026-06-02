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

export const DashboardLoadingSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-9 bg-gray-200 rounded w-24"></div>
            <div className="h-9 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>

        {/* Quote Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-96"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                  <div className="text-right">
                    <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="p-4 border rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};