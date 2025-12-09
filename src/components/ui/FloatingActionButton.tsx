import { useState, ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  className?: string;
}

export const FloatingActionButton = ({ actions, className }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('fixed bottom-20 right-4 z-40 flex flex-col-reverse items-end gap-3', className)}>
      {/* Action buttons */}
      {actions.map((action, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-2 transition-all duration-200',
            isOpen 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4 pointer-events-none'
          )}
          style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
        >
          <span className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium shadow-lg">
            {action.label}
          </span>
          <button
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          >
            {action.icon}
          </button>
        </div>
      ))}

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105',
          isOpen && 'rotate-45 bg-muted text-muted-foreground'
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
};
