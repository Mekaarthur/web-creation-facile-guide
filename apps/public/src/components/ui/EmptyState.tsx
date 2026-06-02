import { ReactNode } from 'react';
import { FileX, Search, Inbox, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateType = 'empty' | 'search' | 'error' | 'inbox';

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

const icons: Record<EmptyStateType, typeof FileX> = {
  empty: FileX,
  search: Search,
  error: AlertCircle,
  inbox: Inbox,
};

export const EmptyState = ({
  type = 'empty',
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) => {
  const Icon = icons[type];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
      
      {children}
    </div>
  );
};
